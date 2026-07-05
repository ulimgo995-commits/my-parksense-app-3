'use client';

import { CloseIcon } from '@/components/common/icons';
import { Button } from '@/components/common/Button';
import {
  CongestionFilterOptions,
  FeeFilterOptions,
  HoursFilterOptions,
  TypeFilterOptions,
} from './filterOptions';
import type { UseParkingFiltersResult } from '@/hooks/useParkingFilters';

interface FilterModalProps extends UseParkingFiltersResult {
  onClose: () => void;
}

const SECTION_TITLE_CLASS = 'mb-2 text-sm font-semibold text-text-primary';

/** "필터" 버튼을 눌렀을 때 뜨는, 모든 필터를 한 번에 볼 수 있는 통합 패널 */
export function FilterModal({
  onClose,
  filters,
  toggleCongestionLevel,
  setMaxFee,
  setHoursMode,
  setType,
  resetFilters,
}: FilterModalProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 animate-fade-in md:items-center md:p-4">
      <div className="animate-fade-in-up max-h-[85vh] w-full overflow-y-auto rounded-t-sheet bg-white p-5 shadow-sheet md:max-w-md md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">필터</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="필터 닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-gray-100"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-5">
          <section>
            <p className={SECTION_TITLE_CLASS}>실시간 주차 가능</p>
            <CongestionFilterOptions filters={filters} toggleCongestionLevel={toggleCongestionLevel} />
          </section>
          <section>
            <p className={SECTION_TITLE_CLASS}>요금</p>
            <FeeFilterOptions filters={filters} setMaxFee={setMaxFee} />
          </section>
          <section>
            <p className={SECTION_TITLE_CLASS}>운영시간</p>
            <HoursFilterOptions filters={filters} setHoursMode={setHoursMode} />
          </section>
          <section>
            <p className={SECTION_TITLE_CLASS}>주차 유형</p>
            <TypeFilterOptions filters={filters} setType={setType} />
          </section>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" fullWidth onClick={resetFilters}>
            초기화
          </Button>
          <Button variant="primary" fullWidth onClick={onClose}>
            적용
          </Button>
        </div>
      </div>
    </div>
  );
}
