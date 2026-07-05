/**
 * 문자열을 결정적(deterministic)인 32bit 정수로 변환합니다.
 * 같은 입력에는 항상 같은 값을 반환하므로, 렌더링마다 값이 바뀌지 않는
 * "고정된 샘플 랜덤값"이 필요한 곳(시간대별 그래프, 소셜 카운트 등)에 사용합니다.
 */
export function hashStringToInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** 정수 시드를 0~1 사이의 결정적 의사난수로 변환 (mulberry32 변형) */
export function seededRandom(seed: number): number {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
