/**
 * 지역별 실시간 주차 정보 API 어댑터의 공통 계약.
 *
 * 지역마다 응답 형식이 전혀 다르므로(예: 대전은 name/lat/lon/totalQty/resQty),
 * 각 지역은 이 인터페이스를 구현하는 어댑터 하나만 추가하면 되고, 스케줄러
 * (app/api/cron/refresh-parking-status)와 Supabase 갱신 로직은 공용으로 재사용됩니다.
 */
export interface LiveStatusUpdate {
  /** database/schema.sql 의 parking_lots.id (예: "dj-0001") */
  parkingLotId: string;
  totalSpaces: number;
  availableSpaces: number;
}

export interface RegionAdapter {
  /** 로그/응답 구분용 고유 id */
  id: string;
  /** 사람이 읽는 지역명 */
  label: string;
  /** 해당 지역 API를 호출해 등록된 주차장들의 최신 상태를 반환합니다. */
  fetchLiveStatuses: () => Promise<LiveStatusUpdate[]>;
}
