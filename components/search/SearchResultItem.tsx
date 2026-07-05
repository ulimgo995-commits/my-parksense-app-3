import { getCongestionLevel } from '@/lib/parking/congestion';
import { CongestionBadge } from '@/components/common/CongestionBadge';
import { formatDistance } from '@/utils/format';
import type { ParkingLot } from '@/types/parking';

interface SearchResultItemProps {
  lot: ParkingLot;
  distanceMeters?: number;
  isHighlighted: boolean;
  onSelect: (lot: ParkingLot) => void;
}

/** 검색 자동완성 드롭다운의 개별 결과 항목 */
export function SearchResultItem({ lot, distanceMeters, isHighlighted, onSelect }: SearchResultItemProps) {
  const level = getCongestionLevel(lot.totalSpaces, lot.availableSpaces);

  return (
    <li>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onSelect(lot)}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ${
          isHighlighted ? 'bg-primary-light/60' : 'hover:bg-gray-50'
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{lot.name}</p>
          <p className="truncate text-xs text-text-secondary">{lot.address}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <CongestionBadge level={level} size="sm" />
          {distanceMeters !== undefined && (
            <span className="text-xs text-text-secondary">{formatDistance(distanceMeters)}</span>
          )}
        </div>
      </button>
    </li>
  );
}
