'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';
import { getCongestionMeta } from '@/lib/parking/congestion';
import { clusterLots } from '@/lib/kakao/clustering';
import {
  createClusterElement,
  createParkingMarkerElement,
  createUserLocationElement,
  setParkingMarkerSelected,
  updateClusterElement,
} from '@/lib/kakao/markerElements';
import { createRouteEtaElement } from '@/lib/kakao/routeElements';
import { getDistanceInMeters } from '@/utils/distance';
import { estimateEtaMinutes } from '@/utils/eta';
import { formatDistance } from '@/utils/format';
import type { LatLng, ParkingLot } from '@/types/parking';
import { MapLoadingSkeleton } from './MapLoadingSkeleton';
import { MapErrorState } from './MapErrorState';

/** 대전광역시청 - 위치 권한이 없거나 실패했을 때의 기본 지도 중심 */
export const DAEJEON_CITY_HALL: LatLng = { lat: 36.3504, lng: 127.3845 };
const DEFAULT_LEVEL = 6;

export interface KakaoMapHandle {
  panTo: (position: LatLng, level?: number) => void;
  /** 지도 중심을 화면 픽셀 단위로 이동합니다 (데스크톱 사이드 패널에 가려지지 않도록 보정하는 용도). */
  panByPixels: (dx: number, dy: number) => void;
  /** 현재 지도 화면(뷰포트) 안에 있는 주차장 id 목록을 반환합니다 ("이 지역 검색" 기능용). */
  getVisibleLotIds: () => string[];
  /** "이 지역 검색" 버튼 클릭 시 현재 화면 기준으로 마커/클러스터를 다시 계산합니다. */
  refreshVisibleArea: () => void;
  /** 지도 컨테이너 크기가 바뀐 뒤(탭 전환 등) 강제로 다시 계산합니다. */
  relayout: () => void;
}

interface KakaoMapProps {
  parkingLots: ParkingLot[];
  selectedLotId: string | null;
  userLocation: LatLng | null;
  onSelectLot: (lot: ParkingLot) => void;
  /**
   * 사용자가 직접 지도를 드래그하거나 확대/축소했을 때 호출됩니다
   * (panTo 등 프로그래밍적으로 지도를 움직인 경우는 제외).
   * "이 지역 검색" 버튼을 띄우는 용도로 사용합니다.
   */
  onViewportChange?: () => void;
  /**
   * 마커/클러스터가 다시 계산될 때마다(최초 로드, panTo 이동 완료, "이 지역 검색" 등)
   * 현재 지도 화면(뷰포트) 안에 있는 주차장 id 목록을 전달합니다.
   * 지역 기준 통계 등, 뷰포트에 반응해야 하는 UI에 사용합니다.
   */
  onBoundsChanged?: (visibleLotIds: string[]) => void;
}

interface MarkerEntry {
  overlay: kakao.maps.CustomOverlay;
  root: HTMLDivElement;
  pin: HTMLDivElement;
  label: HTMLDivElement;
}

interface ClusterEntry {
  overlay: kakao.maps.CustomOverlay;
  element: HTMLDivElement;
  count: number;
}

/**
 * 카카오맵을 렌더링하고 주차장/현재 위치 마커를 관리하는 지도 컴포넌트.
 * 지도 인스턴스와 마커는 React state가 아닌 ref를 통해 명령형으로 관리합니다.
 * (Kakao Maps SDK 자체가 명령형 API이기 때문에 선언형으로 감싸는 것보다 훨씬 안정적입니다.)
 */
export const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  { parkingLots, selectedLotId, userLocation, onSelectLot, onViewportChange, onBoundsChanged },
  ref
) {
  const { status, error } = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const clusterOverlaysRef = useRef<Map<string, ClusterEntry>>(new Map());
  const userOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const routeLineRef = useRef<kakao.maps.Polyline | null>(null);
  const routeEtaOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  // 사용자가 지도를 직접 드래그/확대·축소하면 true — 그 뒤로는 실시간 위치가 갱신돼도
  // 자동으로 지도를 다시 옮기지 않습니다(사용자가 보고 있는 화면을 방해하지 않기 위함).
  const hasUserMovedMapRef = useRef(false);
  const onSelectLotRef = useRef(onSelectLot);
  const onViewportChangeRef = useRef(onViewportChange);
  const onBoundsChangedRef = useRef(onBoundsChanged);
  const parkingLotsRef = useRef(parkingLots);
  const selectedLotIdRef = useRef(selectedLotId);
  // 'none' | 'autoSync' — 프로그래밍적으로 지도를 움직인 직후인지, 그리고 그 뒤에
  // 자동으로 마커를 다시 계산해야 하는지를 나타냅니다. 사용자가 직접 드래그/줌 했을 때는
  // 항상 'none' 상태라서, 아래 dragend/zoom_changed 리스너가 "이 지역 검색" 버튼을 띄웁니다.
  const pendingActionRef = useRef<'none' | 'autoSync'>('none');

  useEffect(() => {
    onSelectLotRef.current = onSelectLot;
  }, [onSelectLot]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    onBoundsChangedRef.current = onBoundsChanged;
  }, [onBoundsChanged]);

  useEffect(() => {
    parkingLotsRef.current = parkingLots;
  }, [parkingLots]);

  useEffect(() => {
    selectedLotIdRef.current = selectedLotId;
  }, [selectedLotId]);

  /**
   * 현재 지도 뷰포트 + 줌 레벨을 기준으로 마커/클러스터를 다시 계산해 동기화합니다.
   * "이 지역 검색" 버튼 클릭, 검색/목록에서 주차장 선택, 필터 변경, 최초 로드 시에만 호출되며,
   * 사용자가 직접 드래그/줌만 했을 때는 호출되지 않습니다 (버튼을 눌러야 갱신).
   * 기존에 이미 표시 중인 마커/클러스터는 재사용하고 변경분만 추가/제거해서,
   * 마커 등장 애니메이션이 불필요하게 다시 재생되는 것을 방지합니다.
   */
  const syncMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.kakao) return;

    const level = map.getLevel();
    const bounds = map.getBounds();
    const visibleLots = parkingLotsRef.current.filter((lot) =>
      bounds.contain(new window.kakao.maps.LatLng(lot.lat, lot.lng))
    );
    onBoundsChangedRef.current?.(visibleLots.map((lot) => lot.id));

    // 선택된 주차장은 (팬 애니메이션이 아직 끝나지 않아) 현재 화면 범위 밖으로 계산되더라도
    // 항상 표시되도록 안전망을 둡니다.
    const selectedId = selectedLotIdRef.current;
    if (selectedId && !visibleLots.some((lot) => lot.id === selectedId)) {
      const selectedLot = parkingLotsRef.current.find((lot) => lot.id === selectedId);
      if (selectedLot) visibleLots.push(selectedLot);
    }

    const keepSingle = selectedId ? new Set([selectedId]) : new Set<string>();
    const { singles, clusters } = clusterLots(visibleLots, level, keepSingle);

    // --- 개별 마커 diff ---
    const nextSingleIds = new Set(singles.map((lot) => lot.id));
    markersRef.current.forEach((entry, id) => {
      if (!nextSingleIds.has(id)) {
        entry.overlay.setMap(null);
        markersRef.current.delete(id);
      }
    });
    singles.forEach((lot) => {
      if (markersRef.current.has(lot.id)) return;
      const meta = getCongestionMeta(lot.totalSpaces, lot.availableSpaces);
      const { root, pin, label } = createParkingMarkerElement({
        color: meta.color,
        availableSpaces: lot.availableSpaces,
        statusLabel: meta.label,
        onClick: () => onSelectLotRef.current(lot),
      });
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lot.lat, lot.lng),
        content: root,
        map,
        yAnchor: 1,
        xAnchor: 0.5,
      });
      markersRef.current.set(lot.id, { overlay, root, pin, label });
    });

    // --- 클러스터 diff (같은 key 는 재사용, 개수만 갱신) ---
    const nextClusterKeys = new Set(clusters.map((cluster) => cluster.key));
    clusterOverlaysRef.current.forEach((entry, key) => {
      if (!nextClusterKeys.has(key)) {
        entry.overlay.setMap(null);
        clusterOverlaysRef.current.delete(key);
      }
    });
    clusters.forEach((cluster) => {
      const existing = clusterOverlaysRef.current.get(cluster.key);
      if (existing) {
        if (existing.count !== cluster.lots.length) {
          existing.count = cluster.lots.length;
          updateClusterElement(existing.element, cluster.lots.length);
        }
        return;
      }

      const position = new window.kakao.maps.LatLng(cluster.lat, cluster.lng);
      const element = createClusterElement(cluster.lots.length, () => {
        const targetMap = mapRef.current;
        if (!targetMap) return;
        const nextLevel = Math.max(1, targetMap.getLevel() - 2);
        // 클러스터를 눌러서 확대하는 건 명시적인 요청이므로, 끝나면 자동으로 다시 계산합니다.
        pendingActionRef.current = 'autoSync';
        targetMap.setLevel(nextLevel, { anchor: position, animate: true });
        targetMap.panTo(position);
      });
      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content: element,
        map,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: 3,
      });
      clusterOverlaysRef.current.set(cluster.key, { overlay, element, count: cluster.lots.length });
    });

    // --- 선택된 마커 강조 스타일 재적용 ---
    markersRef.current.forEach((entry, id) => {
      setParkingMarkerSelected(entry, id === selectedLotIdRef.current);
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      panTo: (position, level) => {
        const map = mapRef.current;
        if (!map || !window.kakao) return;
        const latlng = new window.kakao.maps.LatLng(position.lat, position.lng);
        // panTo는 애니메이션(비동기)이라, 먼저 setLevel부터 호출하면 "아직 이동 중인 옛 중심"을
        // 기준으로 확대되어 엉뚱한 곳이 확대되거나 목표 지점이 화면 가장자리로 밀려납니다.
        // anchor를 목표 좌표로 명시해 확대 기준점을 고정한 뒤, panTo로 정확히 중심을 맞춥니다.
        // 프로그래밍적으로 이동하는 것이므로 "이 지역 검색" 버튼은 띄우지 않고, 이동이 끝나면
        // 자동으로 마커를 다시 계산합니다.
        pendingActionRef.current = 'autoSync';
        if (level !== undefined) {
          map.setLevel(level, { anchor: latlng, animate: true });
        }
        map.panTo(latlng);
      },
      panByPixels: (dx, dy) => {
        mapRef.current?.panBy(dx, dy);
      },
      getVisibleLotIds: () => {
        const map = mapRef.current;
        if (!map) return [];
        const bounds = map.getBounds();
        return parkingLotsRef.current
          .filter((lot) => bounds.contain(new window.kakao.maps.LatLng(lot.lat, lot.lng)))
          .map((lot) => lot.id);
      },
      refreshVisibleArea: () => {
        syncMarkers();
      },
      relayout: () => {
        // 탭 전환 등으로 display:none 상태였다가 다시 보일 때, 지도 크기를 다시 계산하도록 합니다.
        mapRef.current?.relayout();
      },
    }),
    [syncMarkers]
  );

  // 1) SDK 로드 완료 후 지도 최초 1회 생성
  useEffect(() => {
    if (status !== 'success' || !containerRef.current || mapRef.current) return;

    const map = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(DAEJEON_CITY_HALL.lat, DAEJEON_CITY_HALL.lng),
      level: DEFAULT_LEVEL,
    });
    mapRef.current = map;
    map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);

    const handleResize = () => map.relayout();
    window.addEventListener('resize', handleResize);

    // 사용자가 "직접" 드래그하거나 확대/축소했을 때만 "이 지역 검색" 버튼을 띄웁니다.
    // (panTo 등 프로그래밍적 이동 중에는 pendingActionRef 가 'none'이 아니므로 무시됩니다.)
    const handleUserViewportChange = () => {
      if (pendingActionRef.current !== 'none') return;
      hasUserMovedMapRef.current = true;
      onViewportChangeRef.current?.();
    };
    window.kakao.maps.event.addListener(map, 'dragend', handleUserViewportChange);
    window.kakao.maps.event.addListener(map, 'zoom_changed', handleUserViewportChange);

    // 프로그래밍적 이동(panTo, 클러스터 확대 등)이 끝났을 때만 자동으로 마커를 다시 계산합니다.
    const handleIdle = () => {
      const action = pendingActionRef.current;
      pendingActionRef.current = 'none';
      if (action === 'autoSync') syncMarkers();
    };
    window.kakao.maps.event.addListener(map, 'idle', handleIdle);

    // 최초 로드 시 기본 중심(이후 현재 위치를 알면 다시 이동) 기준으로 한 번 표시합니다.
    syncMarkers();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.kakao.maps.event.removeListener(map, 'dragend', handleUserViewportChange);
      window.kakao.maps.event.removeListener(map, 'zoom_changed', handleUserViewportChange);
      window.kakao.maps.event.removeListener(map, 'idle', handleIdle);
    };
  }, [status, syncMarkers]);

  // 1.5) 실시간 위치가 (재조회로 정확도가 개선되며) 바뀔 때마다 지도 중심을 그 위치로 계속
  // 따라가도록 합니다. 최초 한 번만 이동시키면, 브라우저가 처음엔 부정확한 위치를 주고 몇 초 뒤
  // 정확한 값으로 갱신해도 지도가 그 갱신을 반영하지 못해 "현재 위치" 버튼을 눌러야만 정확한
  // 위치로 이동하는 문제가 있었습니다. 다만 사용자가 이미 지도를 직접 움직였거나 특정 주차장을
  // 선택해 그쪽을 보고 있다면 그 화면을 방해하면 안 되므로 그 두 경우엔 따라가지 않습니다.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'success' || !userLocation) return;
    if (selectedLotIdRef.current !== null || hasUserMovedMapRef.current) return;
    const latlng = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
    pendingActionRef.current = 'autoSync';
    map.setLevel(5, { anchor: latlng, animate: true });
    map.panTo(latlng);
  }, [status, userLocation]);

  // 2) 주차장 목록(필터 변경 등)이나 선택 상태가 바뀌면 즉시 마커/클러스터를 다시 계산합니다.
  // (단순 드래그/줌만으로는 재계산되지 않으며, "이 지역 검색" 버튼을 눌러야 합니다.)
  useEffect(() => {
    if (status !== 'success' || !mapRef.current) return;
    syncMarkers();
  }, [parkingLots, selectedLotId, status, syncMarkers]);

  // 4) 현재 위치 마커 동기화
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'success') return;

    if (!userLocation) {
      userOverlayRef.current?.setMap(null);
      userOverlayRef.current = null;
      return;
    }

    const position = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);

    if (userOverlayRef.current) {
      userOverlayRef.current.setPosition(position);
      return;
    }

    userOverlayRef.current = new window.kakao.maps.CustomOverlay({
      position,
      content: createUserLocationElement(),
      map,
      yAnchor: 0.5,
      xAnchor: 0.5,
      zIndex: 5,
    });
  }, [userLocation, status]);

  // 5) 현재위치 → 선택된 주차장 경로선 + 도착 예상 시간 카드
  // (실제 도로 경로 API 대신 직선 거리 기반 근사치를 사용합니다.)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'success') return;

    const selectedLot = parkingLots.find((lot) => lot.id === selectedLotId);

    if (!selectedLot || !userLocation) {
      routeLineRef.current?.setMap(null);
      routeLineRef.current = null;
      routeEtaOverlayRef.current?.setMap(null);
      routeEtaOverlayRef.current = null;
      return;
    }

    const userPoint = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
    const lotPoint = new window.kakao.maps.LatLng(selectedLot.lat, selectedLot.lng);
    const path = [userPoint, lotPoint];

    if (routeLineRef.current) {
      routeLineRef.current.setPath(path);
    } else {
      routeLineRef.current = new window.kakao.maps.Polyline({
        path,
        map,
        strokeWeight: 4,
        strokeColor: '#2563EB',
        strokeOpacity: 0.85,
        strokeStyle: 'solid',
      });
    }

    const distanceMeters = getDistanceInMeters(userLocation, { lat: selectedLot.lat, lng: selectedLot.lng });
    const etaMinutes = estimateEtaMinutes(distanceMeters);
    const midpoint = new window.kakao.maps.LatLng(
      (userLocation.lat + selectedLot.lat) / 2,
      (userLocation.lng + selectedLot.lng) / 2
    );

    routeEtaOverlayRef.current?.setMap(null);
    routeEtaOverlayRef.current = new window.kakao.maps.CustomOverlay({
      position: midpoint,
      content: createRouteEtaElement(etaMinutes, formatDistance(distanceMeters)),
      map,
      yAnchor: 1.6,
      zIndex: 6,
    });
  }, [selectedLotId, userLocation, parkingLots, status]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {status === 'loading' && <MapLoadingSkeleton />}
      {status === 'error' && (
        <MapErrorState
          message={error ?? '알 수 없는 오류가 발생했습니다.'}
          onRetry={() => window.location.reload()}
        />
      )}
    </div>
  );
});
