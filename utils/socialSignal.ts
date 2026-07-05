import { hashStringToInt, seededRandom } from '@/utils/hash';
import type { ParkingLot } from '@/types/parking';

const AVATAR_COLORS = ['#2563EB', '#22C55E', '#F97316', '#A855F7', '#EC4899', '#0EA5E9'];

/**
 * "길찾기 중인 사람 수" — 실시간 사용자 추적 데이터가 없는 MVP 단계에서
 * 화면 구성을 위한 샘플 지표입니다. 주차장 id로 고정되는 결정적 값이라
 * 새로고침해도 값이 바뀌지 않습니다. 총 면수가 크고 혼잡할수록 더 많은
 * 사람이 관심을 갖는다는 가정으로 범위를 가중치화했습니다.
 */
export function getNavigatingCount(lot: ParkingLot): number {
  const seed = hashStringToInt(`${lot.id}:navigating`);
  const sizeWeight = Math.min(lot.totalSpaces / 130, 1);
  const occupancy = lot.totalSpaces > 0 ? 1 - lot.availableSpaces / lot.totalSpaces : 1;
  const base = 2 + sizeWeight * 10 + occupancy * 8;
  const jitter = seededRandom(seed) * 6;
  return Math.max(1, Math.round(base + jitter));
}

export interface AvatarPlaceholder {
  id: string;
  color: string;
}

/** 아바타 스택에 표시할 색상 플레이스홀더 목록 (최대 maxVisible 개) */
export function getAvatarPlaceholders(lot: ParkingLot, maxVisible = 3): AvatarPlaceholder[] {
  const seed = hashStringToInt(`${lot.id}:avatars`);
  return Array.from({ length: maxVisible }, (_, index) => ({
    id: `${lot.id}-avatar-${index}`,
    color: AVATAR_COLORS[Math.floor(seededRandom(seed + index) * AVATAR_COLORS.length) % AVATAR_COLORS.length] as string,
  }));
}
