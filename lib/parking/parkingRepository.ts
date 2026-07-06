import type { ParkingLot } from '@/types/parking';
import { fetchParkingLotsFromSupabase } from '@/lib/supabase/parkingLots';

/**
 * 주차장 데이터 접근 계층.
 *
 * `data/parking_lots.json` 은 여전히 지역별 기본 정보의 단일 원본(및 database/seed.sql
 * 의 적재 소스)이지만, 실시간 가능면수는 app/api/cron/refresh-parking-status 크론이
 * 지역 어댑터(lib/regions)로 주기 수집해 parking_status 테이블만 갱신합니다.
 * 그래서 애플리케이션은 정적 JSON 대신 Supabase(parking_lots + parking_status 조인)를
 * 읽어야 실시간 값을 반영할 수 있습니다 (lib/supabase/parkingLots.ts).
 */
export async function fetchParkingLots(): Promise<ParkingLot[]> {
  return fetchParkingLotsFromSupabase();
}

/** id로 단일 주차장 조회 (검색/딥링크 등에 사용) */
export async function fetchParkingLotById(id: string): Promise<ParkingLot | null> {
  const lots = await fetchParkingLots();
  return lots.find((lot) => lot.id === id) ?? null;
}
