/**
 * 마지막 업데이트 시각을 "3분 전" 형태의 상대 시간 문자열로 변환합니다.
 * 미래 시각이거나 1분 미만 차이는 "방금 전"으로 표기합니다.
 */
export function formatRelativeTime(isoString: string, now: Date = new Date()): string {
  const target = new Date(isoString);
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

/** 1,234 형태의 천 단위 구분 숫자 포맷 */
export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR');
}

/** 두 지점 사이 직선 거리를 사람이 읽기 쉬운 문자열로 변환 (예: "320m", "1.2km") */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
