import type { LiveStatusUpdate } from './types';

/**
 * 한국공항공사_전국공항 주차장 혼잡도 API 어댑터.
 * (apis.data.go.kr/B551178/parking-congestion/info)
 *
 * 이 API는 좌표가 없고 공항명+주차장명(`airportKor`+`parkingAirportCodeName`)만
 * 제공합니다. 안정적인 코드가 없어 이 조합 문자열로 database/seed.sql 에 적재한
 * 25곳(전국 14개 공항)에 매칭합니다. 좌표는 공항 단위 근사값을 사용했습니다
 * (공항 내 개별 주차동 정확한 위치가 아님 — README 참고).
 */
const BASE_URL = 'https://apis.data.go.kr/B551178/parking-congestion/info';
const SERVICE_KEY = '5682af49817ebf44af4c47a58603b674377bd143f6fbed30d658ef2cdd0777d0';

const NAME_TO_ID: Record<string, string> = {
  '김포국제공항|국내선 제1주차장': 'arpt-0001',
  '김포국제공항|국내선 제2주차장': 'arpt-0002',
  '김포국제공항|국제선 주차빌딩': 'arpt-0003',
  '김포국제공항|국제선 지하': 'arpt-0004',
  '김포국제공항|화물청사': 'arpt-0005',
  '김해국제공항|P1 여객주차장': 'arpt-0006',
  '김해국제공항|P2 여객주차장': 'arpt-0007',
  '김해국제공항|P3 여객(화물)': 'arpt-0008',
  '제주국제공항|P1주차장': 'arpt-0009',
  '제주국제공항|P2장기주차장': 'arpt-0010',
  '제주국제공항|화물주차장': 'arpt-0011',
  '대구국제공항|여객주차장': 'arpt-0012',
  '대구국제공항|화물주차장': 'arpt-0013',
  '광주공항|여객주차장(제1+제2)': 'arpt-0014',
  '여수공항|여객주차장': 'arpt-0015',
  '울산공항|여객주차장': 'arpt-0016',
  '군산공항|여객주차장': 'arpt-0017',
  '원주공항|여객주차장': 'arpt-0018',
  '청주국제공항|여객 제1주차장': 'arpt-0019',
  '청주국제공항|여객 제2주차장': 'arpt-0020',
  '청주국제공항|여객 제3주차장': 'arpt-0021',
  '청주국제공항|여객 제4주차장': 'arpt-0022',
  '무안국제공항|여객주차장': 'arpt-0023',
  '사천공항|여객주차장': 'arpt-0024',
  '양양국제공항|여객주차장': 'arpt-0025',
};

interface AirportCongestionResponse {
  response?: {
    body?: {
      items?: {
        item?: Array<{
          airportKor: string;
          parkingAirportCodeName: string;
          parkingTotalSpace: number;
          parkingOccupiedSpace: number;
        }>;
      };
    };
  };
}

export async function fetchAirportLiveStatuses(): Promise<LiveStatusUpdate[]> {
  const url = `${BASE_URL}?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=30&pageNo=1&type=json`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`전국공항 주차장 혼잡도 API 응답 오류: HTTP ${res.status}`);
  }

  const json = (await res.json()) as AirportCongestionResponse;
  const rows = json.response?.body?.items?.item ?? [];

  const updates: LiveStatusUpdate[] = [];
  for (const row of rows) {
    const key = `${row.airportKor}|${row.parkingAirportCodeName}`;
    const parkingLotId = NAME_TO_ID[key];
    if (!parkingLotId) continue;

    const totalSpaces = Number(row.parkingTotalSpace);
    const occupied = Number(row.parkingOccupiedSpace);
    if (!Number.isFinite(totalSpaces) || !Number.isFinite(occupied)) continue;

    const availableSpaces = Math.max(0, totalSpaces - occupied);
    updates.push({ parkingLotId, totalSpaces, availableSpaces });
  }

  return updates;
}
