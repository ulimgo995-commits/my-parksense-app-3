'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';
import { getCongestionMeta } from '@/lib/parking/congestion';
import {
  createParkingMarkerElement,
  createUserLocationElement,
  setParkingMarkerSelected,
} from '@/lib/kakao/markerElements';
import { createRouteEtaElement } from '@/lib/kakao/routeElements';
import { getDistanceInMeters } from '@/utils/distance';
import { estimateEtaMinutes } from '@/utils/eta';
import { formatDistance } from '@/utils/format';
import type { LatLng, ParkingLot } from '@/types/parking';
import { MapLoadingSkeleton } from './MapLoadingSkeleton';
import { MapErrorState } from './MapErrorState';

/** 서울시청 - 위치 권한이 없거나 실패했을 때의 기본 지도 중심 */
export const SEOUL_CITY_HALL: LatLng = { lat: 37.5665, lng: 126.978 };
const DEFAULT_LEVEL = 6;

export interface KakaoMapHandle {
  panTo: (position: LatLng, level?: number) => void;
  /** 지도 중심을 화면 픽셀 단위로 이동합니다 (데스크톱 사이드 패널에 가려지지 않도록 보정하는 용도). */
  panByPixels: (dx: number, dy: number) => void;
  /** 현재 지도 화면(뷰포트) 안에 있는 주차장 id 목록을 반환합니다 ("이 지역 검색" 기능용). */
  getVisibleLotIds: () => string[];
  /** 지도 컨테이너 크기가 바뀐 뒤(탭 전환 등) 강제로 다시 계산합니다. */
  relayout: () => void;
}

interface KakaoMapProps {
  parkingLots: ParkingLot[];
  selectedLotId: string | null;
  userLocation: LatLng | null;
  onSelectLot: (lot: ParkingLot) => void;
  /** 사용자가 직접 지도를 드래그했을 때 호출됩니다 (프로그래밍적 panTo와 구분하기 위함). */
  onUserDrag?: () => void;
}

interface MarkerEntry {
  overlay: kakao.maps.CustomOverlay;
  root: HTMLDivElement;
  pin: HTMLDivElement;
  label: HTMLDivElement;
}

/**
 * 카카오맵을 렌더링하고 주차장/현재 위치 마커를 관리하는 지도 컴포넌트.
 * 지도 인스턴스와 마커는 React state가 아닌 ref를 통해 명령형으로 관리합니다.
 * (Kakao Maps SDK 자체가 명령형 API이기 때문에 선언형으로 감싸는 것보다 훨씬 안정적입니다.)
 */
export const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  { parkingLots, selectedLotId, userLocation, onSelectLot, onUserDrag },
  ref
) {
  const { status, error } = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const userOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const routeLineRef = useRef<kakao.maps.Polyline | null>(null);
  const routeEtaOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const onSelectLotRef = useRef(onSelectLot);
  const onUserDragRef = useRef(onUserDrag);
  const parkingLotsRef = useRef(parkingLots);

  useEffect(() => {
    onSelectLotRef.current = onSelectLot;
  }, [onSelectLot]);

  useEffect(() => {
    onUserDragRef.current = onUserDrag;
  }, [onUserDrag]);

  useEffect(() => {
    parkingLotsRef.current = parkingLots;
  }, [parkingLots]);

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
      relayout: () => {
        // 탭 전환 등으로 display:none 상태였다가 다시 보일 때, 지도 크기를 다시 계산하도록 합니다.
        mapRef.current?.relayout();
      },
    }),
    []
  );

  // 1) SDK 로드 완료 후 지도 최초 1회 생성
  useEffect(() => {
    if (status !== 'success' || !containerRef.current || mapRef.current) return;

    const map = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng),
      level: DEFAULT_LEVEL,
    });
    mapRef.current = map;

    const handleResize = () => map.relayout();
    window.addEventListener('resize', handleResize);

    const handleDragEnd = () => onUserDragRef.current?.();
    window.kakao.maps.event.addListener(map, 'dragend', handleDragEnd);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.kakao.maps.event.removeListener(map, 'dragend', handleDragEnd);
    };
  }, [status]);

  // 2) 주차장 마커 생성/제거 (목록이 바뀔 때만)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'success') return;

    const nextIds = new Set(parkingLots.map((lot) => lot.id));

    markersRef.current.forEach((entry, id) => {
      if (!nextIds.has(id)) {
        entry.overlay.setMap(null);
        markersRef.current.delete(id);
      }
    });

    parkingLots.forEach((lot) => {
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
  }, [parkingLots, status]);

  // 3) 선택된 마커 스타일(확대 + Bounce) 동기화
  useEffect(() => {
    markersRef.current.forEach((entry, id) => {
      setParkingMarkerSelected(entry, id === selectedLotId);
    });
  }, [selectedLotId]);

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
