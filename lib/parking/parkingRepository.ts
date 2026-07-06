import type { ParkingLot } from '@/types/parking';
import rawParkingLots from '@/data/parking_lots.json';

/**
 * 주차장 데이터 접근 계층.
 *
 * MVP 단계에서는 `/data/parking_lots.json` 단일 파일만 읽습니다 (requirements.md 10).
 * 실제 서비스로 전환할 때는 이 함수의 구현부만 공공데이터포털(지자체별 실시간 주차장 API)
 * 호출로 교체하면 되며, 반환 타입(ParkingLot[])과 호출부(useParkingLots)는 변경할 필요가
 * 없도록 설계되어 있습니다.
 *
 * Supabase 백엔드(database/schema.sql)는 이미 준비되어 있으며, 동일한 반환 타입을 갖는
 * lib/supabase/parkingLots.ts 의 fetchParkingLotsFromSupabase() 로 바로 교체할 수 있습니다.
 */
export async function fetchParkingLots(): Promise<ParkingLot[]> {
  // 실제 네트워크 요청이 없는 로컬 JSON이지만, 향후 fetch 기반 API와 동일한 비동기
  // 인터페이스를 유지하기 위해 Promise 로 감쌉니다.
  return rawParkingLots as ParkingLot[];
}

/** id로 단일 주차장 조회 (검색/딥링크 등에 사용) */
export async function fetchParkingLotById(id: string): Promise<ParkingLot | null> {
  const lots = await fetchParkingLots();
  return lots.find((lot) => lot.id === id) ?? null;
}
