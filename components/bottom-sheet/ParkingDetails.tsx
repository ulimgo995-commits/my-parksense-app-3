import type { ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import { CongestionBadge } from '@/components/common/CongestionBadge';
import { CarIcon, ClockIcon, CoinIcon, NavigationIcon, PinIcon, StarIcon } from '@/components/common/icons';
import { getCongestionLevel } from '@/lib/parking/congestion';
import { formatNumber, formatRelativeTime } from '@/utils/format';
import type { ParkingLot } from '@/types/parking';

interface InfoItem {
  icon: ReactNode;
  label: string;
  value: string;
  emphasize?: boolean;
}

interface ParkingDetailsProps {
  lot: ParkingLot;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onNavigate: () => void;
}

/**
 * 주차장 상세 정보 본문. Bottom Sheet(모바일)와 Desktop 사이드 패널이
 * 동일한 컴포넌트를 공유하여 두 화면의 정보 일관성을 보장합니다.
 */
export function ParkingDetails({ lot, isFavorite, onToggleFavorite, onNavigate }: ParkingDetailsProps) {
  const level = getCongestionLevel(lot.totalSpaces, lot.availableSpaces);

  const infoItems: InfoItem[] = [
    { icon: <ClockIcon />, label: '운영시간', value: lot.operationHours },
    { icon: <CoinIcon />, label: '요금', value: lot.fee },
    { icon: <CarIcon />, label: '총 주차면수', value: `${formatNumber(lot.totalSpaces)}면` },
    {
      icon: <CarIcon />,
      label: '현재 가능면수',
      value: `${formatNumber(lot.availableSpaces)}면`,
      emphasize: true,
    },
  ];

  return (
    <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-text-primary">{lot.name}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
            <PinIcon className="shrink-0" />
            <span className="truncate">{lot.address}</span>
          </p>
        </div>
        <CongestionBadge level={level} className="shrink-0" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {infoItems.map((item) => (
          <div key={item.label} className="rounded-xl bg-gray-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              {item.icon}
              {item.label}
            </div>
            <p className={`mt-1 text-sm font-semibold ${item.emphasize ? 'text-primary' : 'text-text-primary'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-text-secondary">마지막 업데이트 {formatRelativeTime(lot.updatedAt)}</p>

      <div className="mt-5 flex gap-3 border-t border-divider pt-4">
        <Button variant="primary" fullWidth onClick={onNavigate}>
          <NavigationIcon />
          길찾기
        </Button>
        <Button
          variant="secondary"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          onClick={onToggleFavorite}
          className={`w-12 shrink-0 px-0 ${isFavorite ? '!border-primary !text-primary' : ''}`}
        >
          <StarIcon filled={isFavorite} />
        </Button>
      </div>
    </div>
  );
}
