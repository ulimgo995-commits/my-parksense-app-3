import { hashStringToInt, seededRandom } from '@/utils/hash';
import type { ParkingLot } from '@/types/parking';

/**
 * 하루 24시간 동안의 "일반적인 도심 주차장 점유율" 기본 패턴(0=완전 여유, 1=만차).
 * 출퇴근 시간대(9~11시, 17~19시)에 높고 새벽에 낮은 전형적인 곡선입니다.
 */
const BASE_HOURLY_OCCUPANCY = [
  0.15, 0.1, 0.08, 0.07, 0.07, 0.1, 0.2, 0.35, 0.55, 0.7, 0.75, 0.72, 0.68, 0.7, 0.72, 0.75, 0.8, 0.85, 0.8, 0.65,
  0.5, 0.35, 0.25, 0.18,
];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * 주차장별 24시간 혼잡도(점유율) 추이를 생성합니다.
 *
 * 실시간 시간대별 이력 데이터가 없는 MVP 단계이므로, 주차장 id를 시드로 한
 * 결정적 샘플 데이터를 생성합니다 (같은 주차장은 항상 같은 그래프를 보여줌).
 * 현재 시각의 값은 실제 availableSpaces/totalSpaces 비율과 항상 일치하도록
 * 전체 곡선을 평행 이동시켜, "지금 몇 면 남았는지"와 그래프가 어긋나지 않게 합니다.
 */
export function getHourlyOccupancy(lot: ParkingLot, now: Date = new Date()): number[] {
  const seed = hashStringToInt(lot.id);

  const jittered = BASE_HOURLY_OCCUPANCY.map((base, hour) => {
    const noise = seededRandom(seed + hour) * 2 - 1; // -1 ~ 1
    return clamp01(base + noise * 0.08);
  });

  const currentHour = now.getHours();
  const currentOccupancy = lot.totalSpaces > 0 ? 1 - lot.availableSpaces / lot.totalSpaces : 1;
  const currentJittered = jittered[currentHour] ?? currentOccupancy;
  const offset = currentOccupancy - currentJittered;

  return jittered.map((value) => clamp01(value + offset));
}
