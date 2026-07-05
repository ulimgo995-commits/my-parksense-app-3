import { supabase } from '@/lib/supabase/client';

/**
 * 길찾기 클릭 로그 (database/schema.sql 의 navigation_events 테이블 기준).
 * 어떤 주차장으로 길찾기를 많이 요청하는지 집계하여 향후 인기 주차장 추천 등에
 * 활용할 수 있도록 준비된 모듈입니다. 길찾기 버튼 클릭은 카카오맵 새 탭 열기가
 * 우선이므로, 이 함수는 실패해도 호출부(BottomSheet)를 절대 막지 않도록
 * 예외를 스스로 삼키고 콘솔 경고만 남깁니다.
 */
export async function logNavigationEvent(parkingLotId: string): Promise<void> {
  try {
    const { error } = await supabase.from('navigation_events').insert({ parking_lot_id: parkingLotId });
    if (error) {
      console.warn('[navigationEvents] 길찾기 로그 기록 실패:', error.message);
    }
  } catch (err) {
    console.warn('[navigationEvents] 길찾기 로그 기록 중 오류:', err);
  }
}
