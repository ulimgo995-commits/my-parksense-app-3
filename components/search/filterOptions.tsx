import { CONGESTION_LEVELS, getCongestionMetaByLevel } from '@/lib/parking/congestion';
import { PARKING_LOT_TYPE_LABEL, PARKING_LOT_TYPES } from '@/lib/parking/parkingLotType';
import { CheckIcon } from '@/components/common/icons';
import type { OperatingHoursMode, ParkingTypeFilter, UseParkingFiltersResult } from '@/hooks/useParkingFilters';

const DOT_COLOR_CLASS: Record<string, string> = {
  available: 'bg-success',
  moderate: 'bg-warning',
  congested: 'bg-danger',
  full: 'bg-full',
};

interface RadioRowProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function RadioRow({ label, selected, onSelect }: RadioRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        selected ? 'bg-primary-light text-primary font-semibold' : 'text-text-primary hover:bg-gray-50'
      }`}
    >
      {label}
      {selected && <CheckIcon />}
    </button>
  );
}

interface CongestionFilterOptionsProps {
  filters: UseParkingFiltersResult['filters'];
  toggleCongestionLevel: UseParkingFiltersResult['toggleCongestionLevel'];
}

/** 실시간 주차 가능(혼잡도) 필터 — 복수 선택 가능 */
export function CongestionFilterOptions({ filters, toggleCongestionLevel }: CongestionFilterOptionsProps) {
  return (
    <div className="flex w-48 flex-col gap-0.5">
      {CONGESTION_LEVELS.map((level) => {
        const meta = getCongestionMetaByLevel(level);
        const checked = filters.congestionLevels.includes(level);
        return (
          <button
            key={level}
            type="button"
            onClick={() => toggleCongestionLevel(level)}
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              checked ? 'text-text-primary' : 'text-text-secondary'
            } hover:bg-gray-50`}
          >
            <span className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${DOT_COLOR_CLASS[level]}`} />
              {meta.label}
            </span>
            {checked && <CheckIcon className="text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

interface FeeFilterOptionsProps {
  filters: UseParkingFiltersResult['filters'];
  setMaxFee: UseParkingFiltersResult['setMaxFee'];
  onAfterSelect?: () => void;
}

const FEE_OPTIONS = [300, 400, 500, 600];

/** 요금(10분당) 상한 필터 — 단일 선택 */
export function FeeFilterOptions({ filters, setMaxFee, onAfterSelect }: FeeFilterOptionsProps) {
  return (
    <div className="flex w-44 flex-col gap-0.5">
      <RadioRow
        label="전체"
        selected={filters.maxFee === null}
        onSelect={() => {
          setMaxFee(null);
          onAfterSelect?.();
        }}
      />
      {FEE_OPTIONS.map((amount) => (
        <RadioRow
          key={amount}
          label={`10분당 ${amount}원 이하`}
          selected={filters.maxFee === amount}
          onSelect={() => {
            setMaxFee(amount);
            onAfterSelect?.();
          }}
        />
      ))}
    </div>
  );
}

interface HoursFilterOptionsProps {
  filters: UseParkingFiltersResult['filters'];
  setHoursMode: UseParkingFiltersResult['setHoursMode'];
  onAfterSelect?: () => void;
}

const HOURS_OPTIONS: { value: OperatingHoursMode; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '24h', label: '24시간 운영' },
  { value: 'limited', label: '제한 운영' },
];

/** 운영시간 필터 — 단일 선택 */
export function HoursFilterOptions({ filters, setHoursMode, onAfterSelect }: HoursFilterOptionsProps) {
  return (
    <div className="flex w-40 flex-col gap-0.5">
      {HOURS_OPTIONS.map((option) => (
        <RadioRow
          key={option.value}
          label={option.label}
          selected={filters.hoursMode === option.value}
          onSelect={() => {
            setHoursMode(option.value);
            onAfterSelect?.();
          }}
        />
      ))}
    </div>
  );
}

interface TypeFilterOptionsProps {
  filters: UseParkingFiltersResult['filters'];
  setType: UseParkingFiltersResult['setType'];
  onAfterSelect?: () => void;
}

/** 주차 유형(노외/노상) 필터 — 단일 선택 */
export function TypeFilterOptions({ filters, setType, onAfterSelect }: TypeFilterOptionsProps) {
  const options: { value: ParkingTypeFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    ...PARKING_LOT_TYPES.map((type) => ({ value: type, label: PARKING_LOT_TYPE_LABEL[type] })),
  ];

  return (
    <div className="flex w-36 flex-col gap-0.5">
      {options.map((option) => (
        <RadioRow
          key={option.value}
          label={option.label}
          selected={filters.type === option.value}
          onSelect={() => {
            setType(option.value);
            onAfterSelect?.();
          }}
        />
      ))}
    </div>
  );
}
