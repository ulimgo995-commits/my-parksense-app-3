import { CongestionBadge } from '@/components/common/CongestionBadge';
import { StarIcon } from '@/components/common/icons';
import { getCongestionLevel } from '@/lib/parking/congestion';
import { formatDistance, formatNumber } from '@/utils/format';
import type { ParkingLot } from '@/types/parking';

interface ParkingListItemProps {
  lot: ParkingLot;
  distanceMeters?: number;
  isFavorite: boolean;
  onSelect: (lot: ParkingLot) => void;
  onToggleFavorite: (lot: ParkingLot) => void;
}

/** 내 주변 / 즐겨찾기 화면에서 공통으로 사용하는 주차장 목록 행 */
export function ParkingListItem({ lot, distanceMeters, isFavorite, onSelect, onToggleFavorite }: ParkingListItemProps) {
  const level = getCongestionLevel(lot.totalSpaces, lot.availableSpaces);

  return (
    <li className="flex items-center gap-3 border-b border-divider py-3 last:border-b-0">
      <button type="button" onClick={() => onSelect(lot)} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">{lot.name}</p>
          <CongestionBadge level={level} size="sm" className="shrink-0" />
        </div>
        <p className="mt-0.5 truncate text-xs text-text-secondary">{lot.address}</p>
        <p className="mt-1 text-xs text-text-secondary">
          현재 <span className="font-semibold text-primary">{formatNumber(lot.availableSpaces)}면</span> 가능 · 총{' '}
          {formatNumber(lot.totalSpaces)}면
          {distanceMeters !== undefined && <> · {formatDistance(distanceMeters)}</>}
        </p>
      </button>
      <button
        type="button"
        onClick={() => onToggleFavorite(lot)}
        aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
          isFavorite ? 'text-primary' : 'text-text-secondary hover:bg-gray-100'
        }`}
      >
        <StarIcon filled={isFavorite} />
      </button>
    </li>
  );
}
