import { CongestionBadge } from '@/components/common/CongestionBadge';
import { CloseIcon, StarIcon } from '@/components/common/icons';
import { getCongestionLevel } from '@/lib/parking/congestion';
import { formatDistance, formatNumber, formatRelativeTime } from '@/utils/format';
import type { ParkingLot } from '@/types/parking';

interface ParkingListItemProps {
  lot: ParkingLot;
  distanceMeters?: number;
  isFavorite: boolean;
  onSelect: (lot: ParkingLot) => void;
  onToggleFavorite: (lot: ParkingLot) => void;
  /** true면 별 아이콘 대신 빨간 삭제 아이콘을 보여줍니다 (즐겨찾기 "편집" 모드용). 동작은 onToggleFavorite과 동일합니다. */
  showRemoveIcon?: boolean;
}

/** 내 주변 / 즐겨찾기 화면에서 공통으로 사용하는 주차장 목록 행 */
export function ParkingListItem({
  lot,
  distanceMeters,
  isFavorite,
  onSelect,
  onToggleFavorite,
  showRemoveIcon = false,
}: ParkingListItemProps) {
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
        aria-label={showRemoveIcon ? '즐겨찾기에서 삭제' : isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
          showRemoveIcon
            ? 'text-danger hover:bg-danger-light'
            : isFavorite
              ? 'text-primary'
              : 'text-text-secondary hover:bg-gray-100'
        }`}
      >
        {showRemoveIcon ? <CloseIcon size={16} /> : <StarIcon filled={isFavorite} />}
      </button>
    </li>
  );
}
