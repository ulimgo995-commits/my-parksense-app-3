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
 * "홈" 랜딩 화면 — 좌측 히어로(검색+통계 배지), 우측 전체 높이 지도 미리보기.
 * 여기서는 상세 패널/필터 없이 지도 클릭이나 검색 선택 시 곧바로 "주차장 찾기"로 이동합니다.
 */
export function LandingScreen() {
  const router = useRouter();
  const { parkingLots, status: lotsStatus } = useParkingLots();
  const { position: userLocation } = useGeolocation();

  const stats: StatBadge[] = useMemo(() => {
    let available = 0;
    let moderate = 0;
    let congested = 0;
    let full = 0;
    for (const lot of parkingLots) {
      const level = getCongestionLevel(lot.totalSpaces, lot.availableSpaces);
      if (level === 'available') available += 1;
      else if (level === 'moderate') moderate += 1;
      else if (level === 'congested') congested += 1;
      else full += 1;
    }
    return [
      { label: '실시간 주차장', value: parkingLots.length, colorClassName: 'text-text-primary' },
      { label: '여유', value: available, colorClassName: 'text-success' },
      { label: '혼잡', value: congested + moderate, colorClassName: 'text-warning' },
      { label: '만차', value: full, colorClassName: 'text-danger' },
    ];
  }, [parkingLots]);

  const goToParkingLot = (lot: ParkingLot) => {
    router.push(`/parking?lot=${encodeURIComponent(lot.id)}`);
  };

  const goToPlace = (place: PlaceResult) => {
    router.push(`/parking?lat=${place.lat}&lng=${place.lng}`);
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

        <div className="mt-6">
          {lotsStatus === 'loading' ? (
            <Skeleton className="h-12 rounded-full" />
          ) : (
            <SearchBar
              parkingLots={parkingLots}
              userLocation={userLocation ?? DAEJEON_CITY_HALL}
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
          실시간 데이터는 지역별 공공데이터 API 갱신 주기에 따라 업데이트됩니다.
        </p>
      </section>

      <div className="relative min-h-[320px] flex-1 md:h-full md:min-h-0">
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
