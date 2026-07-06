import type { LiveStatusUpdate } from './types';

/**
 * 경상남도 진주시_주차장 이용 정보 API 어댑터.
 * (apis.data.go.kr/5310000/jinjuparking/now)
 *
 * 진주시 24곳 중 국토교통부 표준데이터(prkplceNo)와 동일한 ID 체계를 쓰는
 * 7곳을 좌표로 대조해 5곳만 매칭에 성공했습니다(나머지는 진주시 자체 번호라
 * 좌표를 알 수 없어 제외). database/seed.sql 에는 이 5곳만 적재되어 있습니다.
 */
const BASE_URL = 'https://apis.data.go.kr/5310000/jinjuparking/now';
const SERVICE_KEY = '5682af49817ebf44af4c47a58603b674377bd143f6fbed30d658ef2cdd0777d0';

const IDX_TO_ID: Record<string, string> = {
  '381-1-000006': 'jj-0001',
  '381-1-000012': 'jj-0002',
  '381-1-000013': 'jj-0003',
  '381-1-000014': 'jj-0004',
  '381-1-000015': 'jj-0005',
};

interface JinjuResponse {
  body?: {
    items?: Array<{ idx: string; totalSpace: number; usedSpace: number }>;
  };
}

export async function fetchJinjuLiveStatuses(): Promise<LiveStatusUpdate[]> {
  const url = `${BASE_URL}?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=30&pageNo=1&type=json`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`진주시 주차장 API 응답 오류: HTTP ${res.status}`);
  }

  const json = (await res.json()) as JinjuResponse;
  const items = json.body?.items ?? [];

  const updates: LiveStatusUpdate[] = [];
  for (const item of items) {
    const parkingLotId = IDX_TO_ID[item.idx];
    if (!parkingLotId) continue;

    const totalSpaces = Number(item.totalSpace);
    const used = Number(item.usedSpace);
    if (!Number.isFinite(totalSpaces) || !Number.isFinite(used)) continue;

    const availableSpaces = Math.max(0, totalSpaces - used);
    updates.push({ parkingLotId, totalSpaces, availableSpaces });
  }

  return updates;
}
