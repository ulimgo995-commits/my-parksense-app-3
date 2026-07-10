'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KakaoMap, SEOUL_CITY_HALL, type KakaoMapHandle } from '@/components/map/KakaoMap';
import { CurrentLocationButton } from '@/components/map/CurrentLocationButton';
import { CongestionLegend } from '@/components/map/CongestionLegend';
import { SearchBar } from '@/components/search/SearchBar';
import { Skeleton } from '@/components/common/Skeleton';
import { ToggleSwitch } from '@/components/common/ToggleSwitch';
import { LocationPermissionBanner } from '@/components/permission/LocationPermissionBanner';
import { useSharedGeolocation } from '@/components/common/GeolocationProvider';
import { useParkingLots } from '@/hooks/useParkingLots';
import { getCongestionLevel } from '@/lib/parking/congestion';
import { formatNumber } from '@/utils/format';
import type { ParkingLot, PlaceResult } from '@/types/parking';

interface StatBadge {
  label: string;
  value: number;
  colorClassName: string;
}

/**
 * "홈" 랜딩 화면 — 좌측 히어로(검색+통계 배지), 우측 전체 높이 지도 미리보기.
 * 여기서는 상세 패널/필터 없이 지도 클릭이나 검색 선택 시 곧바로 "주차장 찾기"로 이동합니다.
 */
export function LandingScreen() {
  const router = useRouter();
  const { parkingLots, status: lotsStatus } = useParkingLots();
  const { position: userLocation, tentativePosition, status: geoStatus, errorReason, requestLocation } = useSharedGeolocation();
  const mapRef = useRef<KakaoMapHandle>(null);
  // null이면 아직 지도 뷰포트 기준 집계 전(최초 렌더 직후)이라는 뜻 — 이 경우엔 전체 목록으로 보여줍니다.
  const [visibleLotIds, setVisibleLotIds] = useState<string[] | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  // 실제로 걸러낼 데이터가 없어 켜고 끄는 것 외의 동작은 없는, 참고 디자인 재현용 토글입니다.
  const [isRealtimeOnly, setIsRealtimeOnly] = useState(true);

  // 위치 조회 자체는 app/layout.tsx의 GeolocationProvider가 앱 전체에서 한 번만 트리거합니다.
  // 여기서 또 requestLocation()을 호출하면 이 페이지로 올 때마다 새로 조회하게 되어, 이미 확정된
  // (정확할 수도 있는) 값을 버리고 다시 운에 맡기게 되는 문제가 있었습니다.

  // 최초 위치로 지도를 자동 중심 이동시키는 로직은 KakaoMap 내부에서 한 번만 실행합니다.
  // 여기서 별도로 처리하면, 위치 정확도가 나중에 개선되며 userLocation이 다시 바뀔 때마다
  // 사용자가 직접 이동/확대해 둔 지도를 무시하고 다시 움직이는 문제가 있었습니다.

  useEffect(() => {
    if (geoStatus === 'error') setIsBannerDismissed(false);
  }, [geoStatus, errorReason]);

  const showPermissionBanner = geoStatus === 'error' && !isBannerDismissed;

  // 사용자가 지도를 직접 드래그/확대·축소하면 그 지역 기준으로 통계를 다시 계산합니다.
  const handleViewportChange = useCallback(() => {
    mapRef.current?.refreshVisibleArea();
  }, []);

  const lotsInView = useMemo(() => {
    if (!visibleLotIds) return parkingLots;
    const idSet = new Set(visibleLotIds);
    return parkingLots.filter((lot) => idSet.has(lot.id));
  }, [parkingLots, visibleLotIds]);

  const stats: StatBadge[] = useMemo(() => {
    let available = 0;
    let moderate = 0;
    let congested = 0;
    let full = 0;
    for (const lot of lotsInView) {
      const level = getCongestionLevel(lot.totalSpaces, lot.availableSpaces);
      if (level === 'available') available += 1;
      else if (level === 'moderate') moderate += 1;
      else if (level === 'congested') congested += 1;
      else full += 1;
    }
    return [
      { label: '이 지역 주차장', value: lotsInView.length, colorClassName: 'text-text-primary' },
      { label: '여유', value: available, colorClassName: 'text-success' },
      { label: '혼잡', value: congested + moderate, colorClassName: 'text-warning' },
      { label: '만차', value: full, colorClassName: 'text-danger' },
    ];
  }, [lotsInView]);

  const goToParkingLot = (lot: ParkingLot) => {
    router.push(`/parking?lot=${encodeURIComponent(lot.id)}`);
  };

  const goToPlace = (place: PlaceResult) => {
    router.push(`/parking?lat=${place.lat}&lng=${place.lng}`);
  };

  const handleCurrentLocationClick = () => {
    if (userLocation) mapRef.current?.panTo(userLocation, 5);
    requestLocation();
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white md:flex-row">
      <section className="flex w-full shrink-0 flex-col justify-center px-6 py-8 md:h-full md:w-[440px] md:px-10 lg:w-[520px]">
        <h1 className="text-2xl font-extrabold leading-snug text-text-primary md:text-[2.25rem]">
          <span className="text-primary">실시간</span> 주차 가능 여부를
          <br />
          출발 전에 확인하세요
        </h1>
        <p className="mt-3 text-sm text-text-secondary md:text-base">
          지원 지역 주차장의 실시간 정보를 한눈에 확인하고 더 스마트하게 주차하세요.
        </p>
        <p className="mt-1.5 text-xs font-semibold text-primary md:text-sm">
          지도 앱엔 없는 실시간 빈자리 정보를, 지자체 앱보다 더 넓은 지역에서 확인하세요.
        </p>

        <div className="mt-3 inline-flex w-fit items-center rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary">
          5개 도시 · 106개 주차장 실시간 제공 중
        </div>

        <div className="mt-6">
          {lotsStatus === 'loading' ? (
            <Skeleton className="h-12 rounded-full" />
          ) : (
            <SearchBar
              parkingLots={parkingLots}
              userLocation={userLocation ?? SEOUL_CITY_HALL}
              onSelect={goToParkingLot}
              onSelectPlace={goToPlace}
              placeholder="목적지나 주소를 입력하세요"
            />
          )}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-gray-50 px-2 py-3 text-center">
              <p className={`text-base font-bold md:text-lg ${stat.colorClassName}`}>{formatNumber(stat.value)}개</p>
              <p className="mt-0.5 text-[11px] text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-text-secondary">
          <span className="flex h-4 items-center rounded bg-danger px-1.5 text-[10px] font-bold text-white">LIVE</span>
          지도를 움직이면 그 지역 기준으로 통계가 갱신돼요.
        </p>
      </section>

      <div className="relative min-h-[320px] flex-1 md:h-full md:min-h-0">
        <KakaoMap
          ref={mapRef}
          parkingLots={parkingLots}
          selectedLotId={null}
          userLocation={userLocation}
          tentativeUserLocation={tentativePosition}
          onSelectLot={goToParkingLot}
          onViewportChange={handleViewportChange}
          onBoundsChanged={setVisibleLotIds}
        />
        {showPermissionBanner && errorReason && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-4">
            <div className="pointer-events-auto w-full max-w-xl">
              <LocationPermissionBanner
                reason={errorReason}
                onRetry={requestLocation}
                onDismiss={() => setIsBannerDismissed(true)}
              />
            </div>
          </div>
        )}

        {/* 실시간 토글은 참고 디자인 재현용(실제 필터링 없음). 지도 확대/축소 컨트롤(우측)과 겹치지 않을 정도로만 오른쪽 여백을 둡니다. */}
        <div className="pointer-events-none absolute right-12 top-4 z-30 hidden items-center gap-2 md:flex">
          <div className="pointer-events-auto flex h-10 items-center rounded-full bg-white px-3 shadow-floating">
            <ToggleSwitch
              checked={isRealtimeOnly}
              onChange={() => setIsRealtimeOnly((prev) => !prev)}
              label="실시간 주차장만 보기"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 hidden justify-center md:flex">
          <CongestionLegend variant="bar" />
        </div>

        <CurrentLocationButton
          onClick={handleCurrentLocationClick}
          isLoading={geoStatus === 'loading'}
          className="pointer-events-auto absolute bottom-4 right-4 z-30 md:right-6"
        />
      </div>
    </div>
  );
}
