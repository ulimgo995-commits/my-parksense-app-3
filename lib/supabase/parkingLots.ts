import { supabase } from '@/lib/supabase/client';
import type { ParkingLot } from '@/types/parking';

/**
 * Supabase 기반 주차장 조회 (database/schema.sql 의 parking_lots + parking_status 테이블 기준).
 *
 * 이번 단계에서 애플리케이션의 실시간 지도 렌더링은 여전히 requirements.md 10 규칙에 따라
 * `/data/parking_lots.json` 하나만 읽습니다 (lib/parking/parkingRepository.ts).
 * 이 모듈은 향후 parking_status 를 실시간 공공데이터 API로 교체했을 때, 지도 렌더링 로직을
 * 전혀 바꾸지 않고도 `fetchParkingLots` 구현부만 `fetchParkingLotsFromSupabase` 호출로
 * 바꿔치기할 수 있도록 동일한 ParkingLot[] 타입을 반환하는 것이 목적입니다.
 */

interface ParkingLotRow {
  id: string;
  name: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  operation_hours: string;
  fee: string;
  type: string;
}

interface ParkingStatusRow {
  parking_lot_id: string;
  total_spaces: number;
  available_spaces: number;
  updated_at: string;
}

export async function fetchParkingLotsFromSupabase(): Promise<ParkingLot[]> {
  const { data: lotRows, error: lotsError } = await supabase
    .from('parking_lots')
    .select('id, name, district, address, latitude, longitude, operation_hours, fee, type');
  if (lotsError) throw lotsError;

  const { data: statusRows, error: statusError } = await supabase
    .from('parking_status')
    .select('parking_lot_id, total_spaces, available_spaces, updated_at');
  if (statusError) throw statusError;

  const lots = (lotRows ?? []) as ParkingLotRow[];
  const statuses = (statusRows ?? []) as ParkingStatusRow[];
  const statusByLotId = new Map(statuses.map((status) => [status.parking_lot_id, status]));

  // 아직 parking_status 가 없는 주차장(적재 누락)은 혼잡도를 표시할 수 없으므로 제외합니다.
  return lots.flatMap((lot): ParkingLot[] => {
    const status = statusByLotId.get(lot.id);
    if (!status) return [];

    return [
      {
        id: lot.id,
        name: lot.name,
        district: lot.district as ParkingLot['district'],
        address: lot.address,
        lat: lot.latitude,
        lng: lot.longitude,
        operationHours: lot.operation_hours,
        fee: lot.fee,
        totalSpaces: status.total_spaces,
        availableSpaces: status.available_spaces,
        updatedAt: status.updated_at,
        type: lot.type as ParkingLot['type'],
      },
    ];
  });
}
