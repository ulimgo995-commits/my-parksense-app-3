'use client';

import { useCallback, useMemo, useState } from 'react';
import { CONGESTION_LEVELS, getCongestionLevel } from '@/lib/parking/congestion';
import { parseFeeAmount } from '@/utils/fee';
import type { CongestionLevel, ParkingLot, ParkingLotType } from '@/types/parking';

export type OperatingHoursMode = 'all' | '24h' | 'limited';
export type ParkingTypeFilter = ParkingLotType | 'all';

export interface ParkingFilters {
  congestionLevels: CongestionLevel[];
  maxFee: number | null;
  hoursMode: OperatingHoursMode;
  type: ParkingTypeFilter;
}

export const DEFAULT_PARKING_FILTERS: ParkingFilters = {
  congestionLevels: [...CONGESTION_LEVELS],
  maxFee: null,
  hoursMode: 'all',
  type: 'all',
};

function isLotMatch(lot: ParkingLot, filters: ParkingFilters): boolean {
  const level = getCongestionLevel(lot.totalSpaces, lot.availableSpaces);
  if (!filters.congestionLevels.includes(level)) return false;
  if (filters.maxFee !== null && parseFeeAmount(lot.fee) > filters.maxFee) return false;
  if (filters.hoursMode === '24h' && lot.operationHours !== '24시간') return false;
  if (filters.hoursMode === 'limited' && lot.operationHours === '24시간') return false;
  if (filters.type !== 'all' && lot.type !== filters.type) return false;
  return true;
}

/** 지도/목록에 공통으로 사용하는 주차장 필터 상태 훅 */
export function useParkingFilters(parkingLots: ParkingLot[]) {
  const [filters, setFilters] = useState<ParkingFilters>(DEFAULT_PARKING_FILTERS);

  const filteredLots = useMemo(
    () => parkingLots.filter((lot) => isLotMatch(lot, filters)),
    [parkingLots, filters]
  );

  const toggleCongestionLevel = useCallback((level: CongestionLevel) => {
    setFilters((prev) => {
      const has = prev.congestionLevels.includes(level);
      const next = has ? prev.congestionLevels.filter((item) => item !== level) : [...prev.congestionLevels, level];
      // 전부 해제되면 무의미하므로 최소 1개는 유지합니다.
      if (next.length === 0) return prev;
      return { ...prev, congestionLevels: next };
    });
  }, []);

  const setMaxFee = useCallback((maxFee: number | null) => {
    setFilters((prev) => ({ ...prev, maxFee }));
  }, []);

  const setHoursMode = useCallback((hoursMode: OperatingHoursMode) => {
    setFilters((prev) => ({ ...prev, hoursMode }));
  }, []);

  const setType = useCallback((type: ParkingTypeFilter) => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_PARKING_FILTERS), []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.congestionLevels.length !== DEFAULT_PARKING_FILTERS.congestionLevels.length) count += 1;
    if (filters.maxFee !== null) count += 1;
    if (filters.hoursMode !== 'all') count += 1;
    if (filters.type !== 'all') count += 1;
    return count;
  }, [filters]);

  return {
    filters,
    filteredLots,
    toggleCongestionLevel,
    setMaxFee,
    setHoursMode,
    setType,
    resetFilters,
    activeFilterCount,
  };
}

export type UseParkingFiltersResult = ReturnType<typeof useParkingFilters>;
