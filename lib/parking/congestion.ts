import type { CongestionLevel, CongestionMeta } from '@/types/parking';

/**
 * 혼잡도 계산 기준 (requirements.md 4. 데이터 구조)
 * - 여유: 가능면수 비율 60% 이상
 * - 보통: 30~59%
 * - 혼잡: 1~29%
 * - 만차: 0면
 *
 * 실시간 API 연동 시에도 total/available 값만 갱신하면 이 함수가
 * 그대로 혼잡도를 재계산하므로, 상태(status) 컬럼을 별도로 신뢰하지 않고
 * 항상 이 함수를 단일 진실 공급원(source of truth)으로 사용합니다.
 */
export function getCongestionLevel(totalSpaces: number, availableSpaces: number): CongestionLevel {
  if (totalSpaces <= 0 || availableSpaces <= 0) return 'full';

  const ratio = availableSpaces / totalSpaces;

  if (ratio >= 0.6) return 'available';
  if (ratio >= 0.3) return 'moderate';
  return 'congested';
}

const CONGESTION_META: Record<CongestionLevel, CongestionMeta> = {
  available: {
    level: 'available',
    label: '여유',
    color: '#22C55E',
    emoji: '🟢',
  },
  moderate: {
    level: 'moderate',
    label: '보통',
    color: '#FACC15',
    emoji: '🟡',
  },
  congested: {
    level: 'congested',
    label: '혼잡',
    color: '#EF4444',
    emoji: '🔴',
  },
  full: {
    level: 'full',
    label: '만차',
    color: '#374151',
    emoji: '⚫',
  },
};

export function getCongestionMeta(totalSpaces: number, availableSpaces: number): CongestionMeta {
  return CONGESTION_META[getCongestionLevel(totalSpaces, availableSpaces)];
}

export function getCongestionMetaByLevel(level: CongestionLevel): CongestionMeta {
  return CONGESTION_META[level];
}

export const CONGESTION_LEVELS: CongestionLevel[] = ['available', 'moderate', 'congested', 'full'];
