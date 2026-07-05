/**
 * "10분당 500원" 형태의 요금 문자열에서 숫자(원 단위)만 추출합니다.
 * 파싱에 실패하면 정렬/필터링에서 항상 뒤로 밀리도록 Infinity를 반환합니다.
 */
export function parseFeeAmount(fee: string): number {
  const match = fee.match(/([\d,]+)\s*원/);
  if (!match?.[1]) return Infinity;
  return Number(match[1].replace(/,/g, ''));
}
