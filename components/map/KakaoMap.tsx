'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';
import { getCongestionMeta } from '@/lib/parking/congestion';
import {
  createParkingMarkerElement,
  createUserLocationElement,
  setParkingMarkerSelected,
} from '@/lib/kakao/markerElements';
import type { LatLng, ParkingLot } from '@/types/parking';
import { MapLoadingSkeleton } from './MapLoadingSkeleton';
import { MapErrorState } from './MapErrorState';

/** 서울시청 - 위치 권한이 없거나 실패했을 때의 기본 지도 중심 */
export const SEOUL_CITY_HALL: LatLng = { lat: 37.5665, lng: 126.978 };
const DEFAULT_LEVEL = 6;

export interface KakaoMapHandle {
  panTo: (position: LatLng, level?: number) => void;
}

interface KakaoMapProps {
  parkingLots: ParkingLot[];
  selectedLotId: string | null;
  userLocation: LatLng | null;
  onSelectLot: (lot: ParkingLot) => void;
}

interface MarkerEntry {
  overlay: kakao.maps.CustomOverlay;
  root: HTMLDivElement;
  pin: HTMLDivElement;
}

/**
 * 카카오맵을 렌더링하고 주차장/현재 위치 마커를 관리하는 지도 컴포넌트.
 * 지도 인스턴스와 마커는 React state가 아닌 ref를 통해 명령형으로 관리합니다.
 * (Kakao Maps SDK 자체가 명령형 API이기 때문에 선언형으로 감싸는 것보다 훨씬 안정적입니다.)
 */
export const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  { parkingLots, selectedLotId, userLocation, onSelectLot },
  ref
) {
  const { status, error } = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const userOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const onSelectLotRef = useRef(onSelectLot);

  useEffect(() => {
    onSelectLotRef.current = onSelectLot;
  }, [onSelectLot]);

  useImperativeHandle(
    ref,
    () => ({
      panTo: (position, level) => {
        const map = mapRef.current;
        if (!map || !window.kakao) return;
        map.panTo(new window.kakao.maps.LatLng(position.lat, position.lng));
        if (level !== undefined) {
          map.setLevel(level, { animate: true });
        }
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
    return () => window.removeEventListener('resize', handleResize);
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
      const { root, pin } = createParkingMarkerElement(meta.color, () => onSelectLotRef.current(lot));

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lot.lat, lot.lng),
        content: root,
        map,
        yAnchor: 1,
        xAnchor: 0.5,
      });

      markersRef.current.set(lot.id, { overlay, root, pin });
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
