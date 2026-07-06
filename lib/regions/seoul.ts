import type { LiveStatusUpdate } from './types';

/**
 * 서울 열린데이터광장 주차장 API 어댑터.
 * (openapi.seoul.go.kr — 인증키/json/GetParkingInfo/시작/끝)
 *
 * 서울은 위치정보 API(GetParkInfo, 2,204곳)와 실시간 API(GetParkingInfo, 123곳)가
 * 분리되어 있지만, 둘 다 같은 식별자 `PKLT_CD` 를 공유합니다. 다만 실제 겹치는 건
 * 123곳 중 118곳뿐이고, 그중 좌표가 깔끔한 노외(NW) 주차장 + 실시간 연계 중인
 * 곳만 골라 database/seed.sql 에는 50곳만 적재했습니다 (선정 기준: PKLT_KND=NW,
 * PRK_STTS_YN=1). 이 맵을 벗어난 PKLT_CD 는 무시합니다.
 */
const BASE_URL = 'http://openapi.seoul.go.kr:8088';
const AUTH_KEY = '67467a6a4b6d616e313130427a696d76';

const PKLT_CD_TO_ID: Record<string, string> = {
  '1037932': 'sel-0001',
  '1051043': 'sel-0002',
  '1247636': 'sel-0003',
  '1277144': 'sel-0004',
  '1277145': 'sel-0005',
  '1277146': 'sel-0006',
  '1277160': 'sel-0007',
  '1277163': 'sel-0008',
  '1366527': 'sel-0009',
  '1366576': 'sel-0010',
  '1366590': 'sel-0011',
  '1366593': 'sel-0012',
  '1366624': 'sel-0013',
  '1366903': 'sel-0014',
  '1367120': 'sel-0015',
  '1372454': 'sel-0016',
  '1372873': 'sel-0017',
  '1384198': 'sel-0018',
  '1386536': 'sel-0019',
  '1404936': 'sel-0020',
  '1425816': 'sel-0021',
  '1437917': 'sel-0022',
  '1575315': 'sel-0023',
  '1575751': 'sel-0024',
  '1576703': 'sel-0025',
  '1583862': 'sel-0026',
  '1588341': 'sel-0027',
  '171721': 'sel-0028',
  '171730': 'sel-0029',
  '172065': 'sel-0030',
  '172935': 'sel-0031',
  '172937': 'sel-0032',
  '172970': 'sel-0033',
  '172971': 'sel-0034',
  '172979': 'sel-0035',
  '173005': 'sel-0036',
  '173047': 'sel-0037',
  '173424': 'sel-0038',
  '173452': 'sel-0039',
  '173553': 'sel-0040',
  '173646': 'sel-0041',
  '173752': 'sel-0042',
  '173828': 'sel-0043',
  '173831': 'sel-0044',
  '173840': 'sel-0045',
  '173867': 'sel-0046',
  '1913385': 'sel-0047',
  '1913393': 'sel-0048',
  '3187200': 'sel-0049',
  '3246959': 'sel-0050',
};

interface SeoulRealtimeResponse {
  GetParkingInfo?: {
    row?: Array<{
      PKLT_CD: string;
      TPKCT: number;
      NOW_PRK_VHCL_CNT: number;
      PRK_STTS_YN: string;
    }>;
  };
}

export async function fetchSeoulLiveStatuses(): Promise<LiveStatusUpdate[]> {
  const url = `${BASE_URL}/${AUTH_KEY}/json/GetParkingInfo/1/123/`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`서울 주차장 API 응답 오류: HTTP ${res.status}`);
  }

  const json = (await res.json()) as SeoulRealtimeResponse;
  const rows = json.GetParkingInfo?.row ?? [];

  const updates: LiveStatusUpdate[] = [];
  for (const row of rows) {
    const parkingLotId = PKLT_CD_TO_ID[row.PKLT_CD];
    if (!parkingLotId) continue;
    // "0" = 미연계중 — 등록은 되어 있지만 실시간 값이 갱신되지 않는 상태라 건너뜁니다.
    if (row.PRK_STTS_YN !== '1') continue;

    const totalSpaces = Number(row.TPKCT);
    const occupied = Number(row.NOW_PRK_VHCL_CNT);
    if (!Number.isFinite(totalSpaces) || !Number.isFinite(occupied)) continue;

    const availableSpaces = Math.max(0, totalSpaces - occupied);
    updates.push({ parkingLotId, totalSpaces, availableSpaces });
  }

  return updates;
}
