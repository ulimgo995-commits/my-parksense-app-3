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

/** 지도 좌측 하단에 떠 있는 혼잡도 색상 범례 카드 (디자인: 흰 카드 + 항목별 비율 설명) */
export function CongestionLegend() {
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
