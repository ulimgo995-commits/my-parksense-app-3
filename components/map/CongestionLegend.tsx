import { CONGESTION_LEVELS } from '@/lib/parking/congestion';
import { CongestionBadge } from '@/components/common/CongestionBadge';

/** 지도 좌측 하단에 떠 있는 혼잡도 색상 범례 카드 */
export function CongestionLegend() {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-white/95 p-3 shadow-floating backdrop-blur-sm">
      {CONGESTION_LEVELS.map((level) => (
        <CongestionBadge key={level} level={level} size="sm" />
      ))}
    </div>
  );
}
