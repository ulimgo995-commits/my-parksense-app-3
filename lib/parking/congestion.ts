import type { CongestionLevel, CongestionMeta } from '@/types/parking';

/**
 * 혼잡도 계산 기준 (이용안내 페이지 "혼잡도 색상 안내"와 동일한 기준)
 * - 여유: 가능면수 비율 50% 이상
 * - 보통: 20~49%
 * - 혼잡: 1~19% (자리가 하나라도 남아 있는 한 "만차"라고 부르지 않습니다)
 * - 만차: 남은 면수가 실제로 0일 때만
 *
 * "만차"를 비율이 아니라 남은 면수가 정말 0(이하)인지로 판단하는 이유: 예전엔 "만차"를
 * 비율 구간(0~25%)으로 정의해서, 예를 들어 452대 중 97대가 남아 있어도(약 21%) "만차"로
 * 표시되는 문제가 있었습니다. "만차"는 문자 그대로 자리가 없다는 뜻이라, 실제로 남은 면수가
 * 있는데 그렇게 표시되면 이용자가 혼란스러워합니다.
 *
 * 실시간 API 연동 시에도 total/available 값만 갱신하면 이 함수가
 * 그대로 혼잡도를 재계산하므로, 상태(status) 컬럼을 별도로 신뢰하지 않고
 * 항상 이 함수를 단일 진실 공급원(source of truth)으로 사용합니다.
 */
export function getCongestionLevel(totalSpaces: number, availableSpaces: number): CongestionLevel {
  if (totalSpaces <= 0 || availableSpaces <= 0) return 'full';

  const ratio = availableSpaces / totalSpaces;

  if (ratio >= 0.5) return 'available';
  if (ratio >= 0.2) return 'moderate';
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
