import { getCongestionMetaByLevel } from '@/lib/parking/congestion';
import type { CongestionLevel } from '@/types/parking';

interface CongestionBadgeProps {
  level: CongestionLevel;
  size?: 'sm' | 'md';
  className?: string;
}

const DOT_COLOR_CLASS: Record<CongestionLevel, string> = {
  available: 'bg-success',
  moderate: 'bg-warning',
  congested: 'bg-danger',
  full: 'bg-full',
};

/**
 * 혼잡도 배지. 지도 범례, Bottom Sheet, 검색 자동완성 등 모든 화면에서
 * 동일한 색상 매핑(DOT_COLOR_CLASS)을 사용하여 일관성을 보장합니다.
 */
export function CongestionBadge({ level, size = 'md', className = '' }: CongestionBadgeProps) {
  const meta = getCongestionMetaByLevel(level);
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 font-medium text-text-primary ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      } ${className}`}
    >
      <span className={`inline-block rounded-full ${DOT_COLOR_CLASS[level]} ${isSmall ? 'h-1.5 w-1.5' : 'h-2 w-2'}`} />
      {meta.label}
    </span>
  );
}
