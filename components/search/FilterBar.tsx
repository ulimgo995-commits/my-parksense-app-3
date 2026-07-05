'use client';

import { useState } from 'react';
import { getCongestionMetaByLevel } from '@/lib/parking/congestion';
import { PARKING_LOT_TYPE_LABEL } from '@/lib/parking/parkingLotType';
import { FilterIcon } from '@/components/common/icons';
import { FilterChip } from './FilterChip';
import { FilterModal } from './FilterModal';
import { CongestionFilterOptions, FeeFilterOptions, HoursFilterOptions, TypeFilterOptions } from './filterOptions';
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

/**
 * 검색창 아래 가로 스크롤 필터 행. 디자인 참고 이미지의 필터 칩 UI를 구현합니다.
 * 각 칩은 개별 드롭다운으로도, "필터" 버튼을 통해 통합 패널로도 조작할 수 있습니다.
 */
export function FilterBar(props: UseParkingFiltersResult) {
  const { filters, toggleCongestionLevel, setMaxFee, setHoursMode, setType, activeFilterCount } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
        <FilterChip label={getCongestionChipLabel(filters)} isActive={filters.congestionLevels.length !== DEFAULT_PARKING_FILTERS.congestionLevels.length}>
          {() => <CongestionFilterOptions filters={filters} toggleCongestionLevel={toggleCongestionLevel} />}
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

      {isModalOpen && <FilterModal {...props} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
