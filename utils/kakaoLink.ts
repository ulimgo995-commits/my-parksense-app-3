import type { ParkingLot } from '@/types/parking';

/**
 * 카카오맵 길찾기 웹 페이지 URL을 생성합니다.
 * 참고: https://map.kakao.com/link/to/{name},{lat},{lng}
 */
export function getKakaoDirectionsUrl(lot: ParkingLot): string {
  const encodedName = encodeURIComponent(lot.name);
  return `https://map.kakao.com/link/to/${encodedName},${lot.lat},${lot.lng}`;
}
