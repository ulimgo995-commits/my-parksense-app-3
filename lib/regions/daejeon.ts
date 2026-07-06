import type { LiveStatusUpdate } from './types';

/**
 * 대전광역시_실시간 주차장 정보 API 어댑터.
 * (apis.data.go.kr/6300000/pis/parkinglotIF)
 *
 * 이 API는 안정적인 식별번호 필드가 없어(name/lat/lon/... 만 제공) 이름으로
 * 우리 DB의 고정 id(dj-0001~dj-0013)에 매칭합니다. database/seed.sql 에 적재한
 * 13곳과 반드시 이름이 동일해야 하므로, 대상 주차장을 바꾸면 이 맵도 함께 수정하세요.
 */
const BASE_URL = 'https://apis.data.go.kr/6300000/pis/parkinglotIF';
const SERVICE_KEY = '5682af49817ebf44af4c47a58603b674377bd143f6fbed30d658ef2cdd0777d0';
const PAGE_SIZE = 50;
const TOTAL_PAGES = 16; // 대전 전체 756곳 / 페이지당 50곳

const NAME_TO_ID: Record<string, string> = {
  'NJ타워 주차장': 'dj-0001',
  '대전천변 노외공영주차장': 'dj-0002',
  '동춘당생애길 제1공영주차장': 'dj-0003',
  '문창시장1공영주차장': 'dj-0004',
  '문창시장2공영주차장': 'dj-0005',
  '석봉동 공영주차장': 'dj-0006',
  '선화동제5노외': 'dj-0007',
  '송촌공영주차장': 'dj-0008',
  '송촌소리 공영주차장': 'dj-0009',
  '신탄진역 앞 공영주차장': 'dj-0010',
  '월평1동 공영주차장': 'dj-0011',
  '중리시장 제1주차장': 'dj-0012',
  '중리시장 제2주차장': 'dj-0013',
};

export async function fetchDaejeonLiveStatuses(): Promise<LiveStatusUpdate[]> {
  const found = new Map<string, LiveStatusUpdate>();
  const remainingNames = new Set(Object.keys(NAME_TO_ID));

  for (let page = 1; page <= TOTAL_PAGES && remainingNames.size > 0; page += 1) {
    const url = `${BASE_URL}?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=${PAGE_SIZE}&pageNo=${page}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`대전 주차장 API 응답 오류 (page ${page}): HTTP ${res.status}`);
    }

    const xml = await res.text();
    for (const item of parseItems(xml)) {
      if (!remainingNames.has(item.name)) continue;

      const totalSpaces = Number(item.totalQty);
      const availableSpaces = Number(item.resQty);
      // "NONE" 이거나 파싱 실패인 경우(실시간 미제공) 건너뜁니다 — 마지막으로 성공한
      // 값을 유지하는 게, 의미 없는 0으로 덮어써서 "만차"로 잘못 표시하는 것보다 낫습니다.
      if (!Number.isFinite(totalSpaces) || !Number.isFinite(availableSpaces)) continue;

      const parkingLotId = NAME_TO_ID[item.name];
      if (!parkingLotId) continue;
      found.set(parkingLotId, { parkingLotId, totalSpaces, availableSpaces });
      remainingNames.delete(item.name);
    }
  }

  return Array.from(found.values());
}

interface DaejeonRawItem {
  name: string;
  totalQty: string;
  resQty: string;
}

function parseItems(xml: string): DaejeonRawItem[] {
  const items: DaejeonRawItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1] ?? '';
    items.push({
      name: extractTag(block, 'name'),
      totalQty: extractTag(block, 'totalQty'),
      resQty: extractTag(block, 'resQty'),
    });
  }
  return items;
}

function extractTag(block: string, tag: string): string {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(block);
  return match?.[1]?.trim() ?? '';
}
