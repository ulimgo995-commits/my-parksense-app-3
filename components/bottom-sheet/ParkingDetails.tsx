'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import { CongestionBadge } from '@/components/common/CongestionBadge';
import {
  CarIcon,
  ClockIcon,
  CoinIcon,
  NavigationIcon,
  PinIcon,
  RefreshIcon,
  StarIcon,
} from '@/components/common/icons';
import { getCongestionLevel } from '@/lib/parking/congestion';
import { formatNumber, formatRelativeTime } from '@/utils/format';
import { getHourlyOccupancy } from '@/utils/congestionTrend';
import { CongestionTrendChart } from './CongestionTrendChart';
import { NavigatingAvatars } from './NavigatingAvatars';
import type { CongestionLevel, ParkingLot } from '@/types/parking';

interface InfoItem {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

interface ParkingDetailsProps {
  lot: ParkingLot;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onNavigate: () => void;
  /** 제공되면 "상세 정보 보기" 버튼이 표시되고, 클릭 시 호출됩니다 (모바일 Bottom Sheet 확장용). */
  onShowDetails?: () => void;
}

const STAT_TEXT_COLOR: Record<CongestionLevel, string> = {
  available: 'text-success',
  moderate: 'text-warning',
  congested: 'text-danger',
  full: 'text-full',
};

/**
 * 주차장 상세 정보 본문. Bottom Sheet(모바일)와 Desktop 사이드 패널이
 * 동일한 컴포넌트를 공유하여 두 화면의 정보 일관성을 보장합니다.
 */
export function ParkingDetails({ lot, isFavorite, onToggleFavorite, onNavigate, onShowDetails }: ParkingDetailsProps) {
  const level = getCongestionLevel(lot.totalSpaces, lot.availableSpaces);
  const [refreshedAt, setRefreshedAt] = useState(lot.updatedAt);
  const now = new Date();

  const infoItems: InfoItem[] = [
    { icon: <ClockIcon />, label: '운영시간', value: lot.operationHours },
    { icon: <CoinIcon />, label: '요금', value: lot.fee },
    { icon: <CarIcon />, label: '총 주차면수', value: `${formatNumber(lot.totalSpaces)}면` },
    { icon: <CarIcon />, label: '길찾기 중인 사람', value: <NavigatingAvatars lot={lot} /> },
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

      <button
        type="button"
        onClick={() => setRefreshedAt(now.toISOString())}
        className="mt-2 flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-primary"
      >
        <RefreshIcon />
        실시간 업데이트: {formatRelativeTime(refreshedAt, now)}
      </button>

      <div className="mt-4 flex items-center gap-4 rounded-xl bg-gray-50 p-3">
        <div className="shrink-0">
          <p className="text-xs text-text-secondary">현재 주차 가능</p>
          <p className={`text-3xl font-bold leading-tight ${STAT_TEXT_COLOR[level]}`}>
            {formatNumber(lot.availableSpaces)}
            <span className="text-base font-medium">면</span>
          </p>
          <p className="text-xs text-text-secondary">총 {formatNumber(lot.totalSpaces)}면</p>
        </div>
        <div className="min-w-0 flex-1">
          <CongestionTrendChart hourlyOccupancy={getHourlyOccupancy(lot, now)} currentHour={now.getHours()} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {infoItems.map((item) => (
          <div key={item.label} className="rounded-xl bg-gray-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              {item.icon}
              {item.label}
            </div>
            <div className="mt-1 text-sm font-semibold text-text-primary">{item.value}</div>
          </div>
        ))}
      </div>

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

      {onShowDetails && (
        <Button variant="secondary" fullWidth onClick={onShowDetails} className="mt-3">
          상세 정보 보기
        </Button>
      )}
    </div>
  );
}
