'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import { ClockIcon, CoinIcon, GridIcon, NavigationIcon, ParkingPinIcon, PinIcon, RefreshIcon, StarIcon } from '@/components/common/icons';
import { getCongestionLevel, getCongestionMetaByLevel } from '@/lib/parking/congestion';
import { PARKING_LOT_TYPE_LABEL } from '@/lib/parking/parkingLotType';
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
  /** 제공되면 "상세정보" 버튼 클릭 시 모바일 Bottom Sheet도 함께 확장됩니다. */
  onShowDetails?: () => void;
}

const STAT_TEXT_COLOR: Record<CongestionLevel, string> = {
  available: 'text-success',
  moderate: 'text-warning',
  congested: 'text-danger',
  full: 'text-full',
};

const STAT_SUBTEXT: Record<CongestionLevel, string> = {
  available: '주차하기 좋은 상태예요!',
  moderate: '자리가 조금 있어요',
  congested: '서두르는 게 좋아요',
  full: '자리가 없어요',
};

/**
 * 주차장 상세 정보 본문. Bottom Sheet(모바일)와 Desktop 사이드 패널이
 * 동일한 컴포넌트를 공유하여 두 화면의 정보 일관성을 보장합니다.
 */
export function ParkingDetails({ lot, isFavorite, onToggleFavorite, onNavigate, onShowDetails }: ParkingDetailsProps) {
  const level = getCongestionLevel(lot.totalSpaces, lot.availableSpaces);
  const meta = getCongestionMetaByLevel(level);
  const [refreshedAt, setRefreshedAt] = useState(lot.updatedAt);
  const [showTrend, setShowTrend] = useState(false);
  const now = new Date();

  const infoItems: InfoItem[] = [
    { icon: <ClockIcon />, label: '운영시간', value: lot.operationHours },
    { icon: <CoinIcon />, label: '주차요금', value: lot.fee },
    { icon: <ParkingPinIcon size={14} />, label: '주차 유형', value: PARKING_LOT_TYPE_LABEL[lot.type] },
  ];

  return (
    <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="truncate text-lg font-bold text-text-primary">{lot.name}</h2>
            <button
              type="button"
              aria-pressed={isFavorite}
              aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              onClick={onToggleFavorite}
              className={`shrink-0 transition-colors ${isFavorite ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
            >
              <StarIcon size={20} filled={isFavorite} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRefreshedAt(now.toISOString())}
            className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-primary"
          >
            <span className="rounded bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              LIVE
            </span>
            {formatRelativeTime(refreshedAt, now)} 업데이트
            <RefreshIcon size={12} />
          </button>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-text-secondary">
            <PinIcon className="shrink-0" />
            <span className="truncate">{lot.address}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-gray-50 px-2 py-3 text-center">
          <p className="text-[11px] text-text-secondary">현재 상태</p>
          <p className={`mt-1 text-sm font-bold ${STAT_TEXT_COLOR[level]}`}>
            {meta.emoji} {meta.label}
          </p>
          <p className="mt-0.5 text-[10px] leading-tight text-text-secondary">{STAT_SUBTEXT[level]}</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-2 py-3 text-center">
          <p className="text-[11px] text-text-secondary">남은 주차면</p>
          <p className={`mt-1 text-lg font-bold leading-none ${STAT_TEXT_COLOR[level]}`}>
            {formatNumber(lot.availableSpaces)}대
          </p>
          <p className="mt-1 text-[10px] text-text-secondary">/ 총 {formatNumber(lot.totalSpaces)}대</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 px-2 py-3 text-center">
          <p className="text-[11px] text-text-secondary">길찾기 중인 사람</p>
          <div className="mt-1.5">
            <NavigatingAvatars lot={lot} />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {infoItems.map((item) => (
          <div key={item.label} className="rounded-xl bg-gray-50 px-2.5 py-2.5">
            <div className="flex items-center gap-1 text-[11px] text-text-secondary">
              {item.icon}
              {item.label}
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-text-primary">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2 border-t border-divider pt-4">
        <Button variant="primary" fullWidth onClick={onNavigate}>
          <NavigationIcon />
          길찾기
        </Button>
        <Button
          variant="secondary"
          className="shrink-0 whitespace-nowrap"
          onClick={() => {
            setShowTrend((prev) => !prev);
            onShowDetails?.();
          }}
        >
          <GridIcon size={16} />
          {showTrend ? '간략히' : '상세정보'}
        </Button>
      </div>

      {showTrend && (
        <div className="animate-fade-in mt-4 rounded-xl bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-text-secondary">24시간 혼잡도 추이</p>
          <CongestionTrendChart hourlyOccupancy={getHourlyOccupancy(lot, now)} currentHour={now.getHours()} />
        </div>
      )}
    </div>
  );
}
