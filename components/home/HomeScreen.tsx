'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { KakaoMap, SEOUL_CITY_HALL, type KakaoMapHandle } from '@/components/map/KakaoMap';
import { CurrentLocationButton } from '@/components/map/CurrentLocationButton';
import { CongestionLegend } from '@/components/map/CongestionLegend';
import { SearchBar } from '@/components/search/SearchBar';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { LocationPermissionBanner } from '@/components/permission/LocationPermissionBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useParkingLots } from '@/hooks/useParkingLots';
import type { ParkingLot } from '@/types/parking';

/**
 * ParkSense 메인(Home) 화면.
 * 전체 화면 지도를 배경으로 검색창, 현재 위치 버튼, Bottom Sheet를 오버레이로 배치합니다.
 * (디자인 가이드 5. 메인 화면 구성)
 */
export function HomeScreen() {
  const { parkingLots, status: lotsStatus, error: lotsError, refetch } = useParkingLots();
  const { position: userLocation, status: geoStatus, errorReason, requestLocation } = useGeolocation();

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const mapRef = useRef<KakaoMapHandle>(null);

  // 최초 진입 시 자동으로 위치 권한을 요청합니다 (requirements.md 3-1 Home 필수 기능).
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 현재 위치를 새로 얻을 때마다(최초 진입 포함) 지도 중심을 이동합니다.
  useEffect(() => {
    if (userLocation) {
      mapRef.current?.panTo(userLocation, 5);
    }
  }, [userLocation]);

  useEffect(() => {
    if (geoStatus === 'error') setIsBannerDismissed(false);
  }, [geoStatus, errorReason]);

  const selectedLot = parkingLots.find((lot) => lot.id === selectedLotId) ?? null;

  const handleSelectLot = useCallback((lot: ParkingLot) => {
    setSelectedLotId(lot.id);
    mapRef.current?.panTo({ lat: lot.lat, lng: lot.lng }, 4);
  }, []);

  const handleCloseSheet = useCallback(() => setSelectedLotId(null), []);

  const handleCurrentLocationClick = useCallback(() => {
    if (userLocation) {
      mapRef.current?.panTo(userLocation, 5);
    }
    requestLocation();
  }, [requestLocation, userLocation]);

  const showPermissionBanner = geoStatus === 'error' && !isBannerDismissed;
  const locationButtonBottomClass = selectedLotId
    ? 'bottom-[calc(42vh+16px)] md:bottom-8'
    : 'bottom-6 md:bottom-8';

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-100">
      <div className="absolute inset-0">
        <KakaoMap
          ref={mapRef}
          parkingLots={parkingLots}
          selectedLotId={selectedLotId}
          userLocation={userLocation}
          onSelectLot={handleSelectLot}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto w-full max-w-xl">
          {lotsStatus === 'loading' ? (
            <Skeleton className="h-12 rounded-full" />
          ) : (
            <SearchBar parkingLots={parkingLots} userLocation={userLocation ?? SEOUL_CITY_HALL} onSelect={handleSelectLot} />
          )}
        </div>
        {showPermissionBanner && errorReason && (
          <div className="pointer-events-auto mx-auto w-full max-w-xl">
            <LocationPermissionBanner
              reason={errorReason}
              onRetry={requestLocation}
              onDismiss={() => setIsBannerDismissed(true)}
            />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-6 left-6 z-30 hidden md:block">
        <CongestionLegend />
      </div>

      <CurrentLocationButton
        onClick={handleCurrentLocationClick}
        isLoading={geoStatus === 'loading'}
        className={`pointer-events-auto absolute right-4 z-30 transition-[bottom] duration-300 md:right-6 ${locationButtonBottomClass}`}
      />

      <BottomSheet lot={selectedLot} onClose={handleCloseSheet} />

      {lotsStatus === 'error' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <EmptyState
            icon="⚠️"
            title="주차장 정보를 불러오지 못했어요"
            description={lotsError ?? undefined}
            action={
              <Button variant="primary" onClick={refetch} className="mt-2">
                다시 시도
              </Button>
            }
          />
        </div>
      )}

      {lotsStatus === 'success' && parkingLots.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <EmptyState icon="🅿️" title="표시할 주차장이 없어요" description="잠시 후 다시 확인해주세요." />
        </div>
      )}
    </div>
  );
}
