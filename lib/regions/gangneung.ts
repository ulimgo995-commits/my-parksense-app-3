import type { LiveStatusUpdate } from './types';

/**
 * 강원특별자치도 강릉시_교통정보 조회서비스 어댑터.
 * (apis.data.go.kr/4201000/GNitsTrafficInfoService_1.0/getParkRltm)
 *
 * 대전과 달리 이 API는 기본정보(getParkInfo)와 실시간(getParkRltm)이 안정적인
 * 식별자 `prkId` 를 공유합니다. 이름 매칭 없이 prkId → 우리 DB id 로 바로 매핑합니다.
 */
const BASE_URL = 'https://apis.data.go.kr/4201000/GNitsTrafficInfoService_1.0/getParkRltm';
const SERVICE_KEY = '5682af49817ebf44af4c47a58603b674377bd143f6fbed30d658ef2cdd0777d0';

const PRK_ID_TO_ID: Record<string, string> = {
  PLOT000001: 'gn-0001',
  PLOT000002: 'gn-0002',
  PLOT000003: 'gn-0003',
  PLOT000004: 'gn-0004',
  PLOT000005: 'gn-0005',
  PLOT000006: 'gn-0006',
  PLOT000007: 'gn-0007',
  PLOT000009: 'gn-0008',
  PLOT000010: 'gn-0009',
  PLOT000011: 'gn-0010',
  PLOT000012: 'gn-0011',
  PLOT000013: 'gn-0012',
  PLOT000014: 'gn-0013',
};

interface GangneungRealtimeResponse {
  body?: {
    items?: {
      item?: Array<{ prkId: string; totalLots: string; availLots: string }>;
    };
  };
}

export async function fetchGangneungLiveStatuses(): Promise<LiveStatusUpdate[]> {
  const url = `${BASE_URL}?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=100&pageNo=1`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`강릉시 주차장 API 응답 오류: HTTP ${res.status}`);
  }

  const json = (await res.json()) as GangneungRealtimeResponse;
  const items = json.body?.items?.item ?? [];

  const updates: LiveStatusUpdate[] = [];
  for (const item of items) {
    const parkingLotId = PRK_ID_TO_ID[item.prkId];
    if (!parkingLotId) continue;

    const totalSpaces = Number(item.totalLots);
    const availableSpaces = Number(item.availLots);
    if (!Number.isFinite(totalSpaces) || !Number.isFinite(availableSpaces)) continue;

    updates.push({ parkingLotId, totalSpaces, availableSpaces });
  }

  return updates;
}
