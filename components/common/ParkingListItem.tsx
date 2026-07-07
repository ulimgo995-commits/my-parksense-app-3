import { CongestionBadge } from '@/components/common/CongestionBadge';
import { StarIcon } from '@/components/common/icons';
import { getCongestionLevel } from '@/lib/parking/congestion';
import { formatDistance, formatNumber, formatRelativeTime } from '@/utils/format';
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
    <li className="flex items-start gap-3 border-b border-divider py-3 last:border-b-0">
      <CongestionBadge level={level} size="sm" variant="solid" className="mt-0.5 shrink-0" />
      <button type="button" onClick={() => onSelect(lot)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold text-text-primary">{lot.name}</p>
        <p className="mt-0.5 text-sm font-bold text-text-primary">
          {formatNumber(lot.availableSpaces)}
          <span className="font-normal text-text-secondary"> / {formatNumber(lot.totalSpaces)}대</span>
        </p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {lot.address}
          {distanceMeters !== undefined && <> · {formatDistance(distanceMeters)}</>}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">{formatRelativeTime(lot.updatedAt)} 업데이트</p>
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
