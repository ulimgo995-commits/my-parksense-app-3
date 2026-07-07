import { CONGESTION_LEVELS, getCongestionMetaByLevel } from '@/lib/parking/congestion';
import type { CongestionLevel } from '@/types/parking';

const RANGE_LABEL: Record<CongestionLevel, string> = {
  available: '60% 이상',
  moderate: '30~59%',
  congested: '1~29%',
  full: '0면',
};

const DOT_COLOR_CLASS: Record<CongestionLevel, string> = {
  available: 'bg-success',
  moderate: 'bg-warning',
  congested: 'bg-danger',
  full: 'bg-full',
};

interface CongestionLegendProps {
  /** 'card'(기본): 세로 카드 + 비율 설명. 'bar': 지도 하단에 가로로 얇게 펼치는 형태. */
  variant?: 'card' | 'bar';
}

/** 지도 위에 떠 있는 혼잡도 색상 범례. */
export function CongestionLegend({ variant = 'card' }: CongestionLegendProps) {
  if (variant === 'bar') {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-white/95 px-4 py-2.5 shadow-floating backdrop-blur-sm">
        {CONGESTION_LEVELS.map((level) => {
          const meta = getCongestionMetaByLevel(level);
          return (
            <span key={level} className="flex items-center gap-1.5 whitespace-nowrap text-xs text-text-primary">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${DOT_COLOR_CLASS[level]}`} />
              {meta.label}
            </span>
          );
        })}
        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-text-secondary">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300" />
          정보 없음
        </span>
      </div>
    );
  }

  return (
    <div className="w-44 rounded-2xl bg-white/95 p-3 shadow-floating backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-text-primary">주차 가능 비율</p>
      <div className="flex flex-col gap-1.5">
        {CONGESTION_LEVELS.map((level) => {
          const meta = getCongestionMetaByLevel(level);
          return (
            <div key={level} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-text-primary">
                <span className={`inline-block h-2 w-2 rounded-full ${DOT_COLOR_CLASS[level]}`} />
                {meta.label}
              </span>
              <span className="text-text-secondary">{RANGE_LABEL[level]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
