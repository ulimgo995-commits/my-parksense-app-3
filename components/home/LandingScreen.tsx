'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { KakaoMap, DAEJEON_CITY_HALL } from '@/components/map/KakaoMap';
import { SearchBar } from '@/components/search/SearchBar';
import { Skeleton } from '@/components/common/Skeleton';
import { useGeolocation } from '@/hooks/useGeolocation';
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
 * "홈" 랜딩 화면 — 히어로 검색 + 실시간 통계 배지 + 전체 화면 지도 미리보기.
 * 여기서는 상세 패널/필터 없이 지도 클릭이나 검색 선택 시 곧바로 "주차장 찾기"로 이동합니다.
 */
export function LandingScreen() {
  const router = useRouter();
  const { parkingLots, status: lotsStatus } = useParkingLots();
  const { position: userLocation } = useGeolocation();

  const stats: StatBadge[] = useMemo(() => {
    const total = parkingLots.length;
    let available = 0;
    let congested = 0;
    for (const lot of parkingLots) {
      const level = getCongestionLevel(lot.totalSpaces, lot.availableSpaces);
      if (level === 'available') available += 1;
      if (level === 'congested' || level === 'full') congested += 1;
    }
    return [
      { label: '전체 주차장', value: total, colorClassName: 'text-text-primary' },
      { label: '여유', value: available, colorClassName: 'text-success' },
      { label: '혼잡/만차', value: congested, colorClassName: 'text-danger' },
    ];
  }, [parkingLots]);

  const goToParkingLot = (lot: ParkingLot) => {
    router.push(`/parking?lot=${encodeURIComponent(lot.id)}`);
  };

  const goToPlace = (place: PlaceResult) => {
    router.push(`/parking?lat=${place.lat}&lng=${place.lng}`);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <section className="mx-auto w-full max-w-3xl shrink-0 px-6 pb-5 pt-6 text-center md:pb-6 md:pt-10">
        <h1 className="text-2xl font-extrabold leading-snug text-text-primary md:text-4xl">
          <span className="text-primary">실시간</span> 주차 가능 여부를
          <br />
          출발 전에 확인하세요
        </h1>
        <p className="mt-3 text-sm text-text-secondary md:text-base">
          지원 지역 주차장의 실시간 정보를 한눈에 확인하고 더 스마트하게 주차하세요.
        </p>

        <div className="mx-auto mt-6 max-w-xl">
          {lotsStatus === 'loading' ? (
            <Skeleton className="h-12 rounded-full" />
          ) : (
            <SearchBar
              parkingLots={parkingLots}
              userLocation={userLocation ?? DAEJEON_CITY_HALL}
              onSelect={goToParkingLot}
              onSelectPlace={goToPlace}
              placeholder="목적지나 주차장을 검색하세요"
            />
          )}
        </div>

        <div className="mx-auto mt-5 flex max-w-xl justify-center gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`text-lg font-bold md:text-xl ${stat.colorClassName}`}>{formatNumber(stat.value)}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="relative min-h-0 flex-1">
        <KakaoMap
          parkingLots={parkingLots}
          selectedLotId={null}
          userLocation={userLocation}
          onSelectLot={goToParkingLot}
        />
      </div>
    </div>
  );
}
