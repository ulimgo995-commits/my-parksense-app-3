'use client';

import { useEffect, useRef, useState } from 'react';
import { getCongestionMetaByLevel } from '@/lib/parking/congestion';
import { PARKING_LOT_TYPE_LABEL } from '@/lib/parking/parkingLotType';
import { ChevronDownIcon, FilterIcon, RefreshIcon, StarIcon } from '@/components/common/icons';
import { FilterChip } from './FilterChip';
import { FilterModal } from './FilterModal';
import {
  CongestionFilterOptions,
  DEFAULT_RADIUS_KM,
  FeeFilterOptions,
  HoursFilterOptions,
  RadiusFilterOptions,
  TypeFilterOptions,
} from './filterOptions';
import type { UseParkingFiltersResult } from '@/hooks/useParkingFilters';
import { DEFAULT_PARKING_FILTERS } from '@/hooks/useParkingFilters';

function getCongestionChipLabel(filters: UseParkingFiltersResult['filters']): string {
  const { congestionLevels } = filters;
  const first = congestionLevels[0];
  if (congestionLevels.length === DEFAULT_PARKING_FILTERS.congestionLevels.length) return '실시간 주차 가능';
  if (congestionLevels.length === 1 && first) {
    return getCongestionMetaByLevel(first).label;
  }
  return `${getCongestionMetaByLevel(first ?? 'available').label} 외 ${congestionLevels.length - 1}개`;
}

function getFeeChipLabel(filters: UseParkingFiltersResult['filters']): string {
  return filters.maxFee === null ? '요금' : `${filters.maxFee}원 이하`;
}

function getHoursChipLabel(filters: UseParkingFiltersResult['filters']): string {
  if (filters.hoursMode === 'all') return '운영시간';
  return filters.hoursMode === '24h' ? '24시간 운영' : '제한 운영';
}

function getTypeChipLabel(filters: UseParkingFiltersResult['filters']): string {
  return filters.type === 'all' ? '주차 유형' : PARKING_LOT_TYPE_LABEL[filters.type];
}

interface FilterBarProps extends UseParkingFiltersResult {
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  /** 제공되면 검색 결과 반경(km) 칩이 함께 표시됩니다. */
  radiusKm?: number;
  onSetRadiusKm?: (km: number) => void;
}

/**
 * 검색창 아래 가로 스크롤 필터 행. 디자인 참고 이미지의 필터 칩 UI를 구현합니다.
 * 각 칩은 개별 드롭다운으로도, "필터" 버튼을 통해 통합 패널로도 조작할 수 있습니다.
 */
export function FilterBar({
  favoritesOnly,
  onToggleFavoritesOnly,
  radiusKm,
  onSetRadiusKm,
  ...props
}: FilterBarProps) {
  const { filters, toggleCongestionLevel, selectAllCongestionLevels, setMaxFee, setHoursMode, setType, resetFilters, activeFilterCount } =
    props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 마우스로는 overflow-x-auto 영역을 드래그로 넘길 수 없어서(터치와 달리 스크롤바 드래그만
  // 가능), 좌우 화살표 버튼으로도 넘길 수 있게 합니다. 끝까지 스크롤된 방향의 화살표는 숨깁니다.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <>
      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount(-120)}
            aria-label="이전 필터 보기"
            className="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-floating"
          >
            <ChevronDownIcon size={12} className="rotate-90 text-text-secondary" />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className={`no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5 ${canScrollLeft ? 'pl-8' : ''} ${canScrollRight ? 'pr-8' : ''}`}
        >
        {radiusKm !== undefined && onSetRadiusKm && (
          <FilterChip label={`거리 ${radiusKm}km`} isActive={radiusKm !== DEFAULT_RADIUS_KM}>
            {(close) => <RadiusFilterOptions radiusKm={radiusKm} setRadiusKm={onSetRadiusKm} onAfterSelect={close} />}
          </FilterChip>
        )}
        <FilterChip
          label={getCongestionChipLabel(filters)}
          isActive={filters.congestionLevels.length !== DEFAULT_PARKING_FILTERS.congestionLevels.length}
        >
          {() => (
            <CongestionFilterOptions
              filters={filters}
              toggleCongestionLevel={toggleCongestionLevel}
              selectAllCongestionLevels={selectAllCongestionLevels}
            />
          )}
        </FilterChip>
        <FilterChip label={getFeeChipLabel(filters)} isActive={filters.maxFee !== null}>
          {(close) => <FeeFilterOptions filters={filters} setMaxFee={setMaxFee} onAfterSelect={close} />}
        </FilterChip>
        <FilterChip label={getHoursChipLabel(filters)} isActive={filters.hoursMode !== 'all'}>
          {(close) => <HoursFilterOptions filters={filters} setHoursMode={setHoursMode} onAfterSelect={close} />}
        </FilterChip>
        <FilterChip label={getTypeChipLabel(filters)} isActive={filters.type !== 'all'}>
          {(close) => <TypeFilterOptions filters={filters} setType={setType} onAfterSelect={close} />}
        </FilterChip>

        <button
          type="button"
          onClick={onToggleFavoritesOnly}
          aria-pressed={favoritesOnly}
          className={`flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold shadow-card transition-colors ${
            favoritesOnly
              ? 'border-primary bg-primary text-white'
              : 'border-divider bg-white text-text-primary hover:bg-gray-50'
          }`}
        >
          <StarIcon size={14} filled={favoritesOnly} />
          즐겨찾기
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold shadow-card transition-colors ${
            activeFilterCount > 0
              ? 'border-primary bg-primary text-white'
              : 'border-divider bg-white text-text-primary hover:bg-gray-50'
          }`}
        >
          <FilterIcon />
          필터
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
              {activeFilterCount}
            </span>
          )}
        </button>
        </div>
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount(120)}
            aria-label="다음 필터 보기"
            className="absolute right-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-floating"
          >
            <ChevronDownIcon size={12} className="-rotate-90 text-text-secondary" />
          </button>
        )}
      </div>

      {(activeFilterCount > 0 || (radiusKm !== undefined && radiusKm !== DEFAULT_RADIUS_KM)) && (
        <button
          type="button"
          onClick={() => {
            resetFilters();
            onSetRadiusKm?.(DEFAULT_RADIUS_KM);
          }}
          className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-text-secondary transition-colors hover:text-primary"
        >
          <RefreshIcon size={12} />
          필터 초기화
        </button>
      )}

      {isModalOpen && <FilterModal {...props} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
