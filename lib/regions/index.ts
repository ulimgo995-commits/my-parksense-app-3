import { fetchDaejeonLiveStatuses } from './daejeon';
import type { RegionAdapter } from './types';

/**
 * 실시간 갱신 스케줄러(app/api/cron/refresh-parking-status)가 순회할 지역 목록.
 * 새 지역을 추가할 때는 lib/regions/<region>.ts 에 어댑터를 만들고 여기에 등록만 하면
 * 스케줄러/에러 처리/Supabase 갱신 로직을 그대로 재사용할 수 있습니다.
 */
export const REGION_ADAPTERS: RegionAdapter[] = [
  { id: 'daejeon', label: '대전광역시', fetchLiveStatuses: fetchDaejeonLiveStatuses },
];

export type { LiveStatusUpdate, RegionAdapter } from './types';
