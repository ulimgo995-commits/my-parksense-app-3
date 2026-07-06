import { PinIcon } from '@/components/common/icons';
import type { PlaceResult } from '@/types/parking';

interface PlaceResultItemProps {
  place: PlaceResult;
  isHighlighted: boolean;
  onSelect: (place: PlaceResult) => void;
}

/** 검색 드롭다운의 실제 장소/주소 결과 항목 (카카오 Places 검색 결과) */
export function PlaceResultItem({ place, isHighlighted, onSelect }: PlaceResultItemProps) {
  return (
    <li>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onSelect(place)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
          isHighlighted ? 'bg-primary-light/60' : 'hover:bg-gray-50'
        }`}
      >
        <PinIcon size={16} className="shrink-0 text-text-secondary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{place.name}</p>
          <p className="truncate text-xs text-text-secondary">{place.address}</p>
        </div>
      </button>
    </li>
  );
}
