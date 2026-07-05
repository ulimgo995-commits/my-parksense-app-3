/** 도심 평균 주행 속도 가정치 (km/h) — 실제 경로 API 대신 직선거리 기반 근사치 계산에 사용 */
const AVERAGE_URBAN_SPEED_KMH = 25;

/** 직선 거리(m)를 기반으로 대략적인 도착 예상 시간(분)을 계산합니다. 최소 1분. */
export function estimateEtaMinutes(distanceMeters: number): number {
  const hours = distanceMeters / 1000 / AVERAGE_URBAN_SPEED_KMH;
  return Math.max(1, Math.round(hours * 60));
}
