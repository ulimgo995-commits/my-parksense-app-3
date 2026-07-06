/**
 * ParkSense 도메인 타입 정의.
 *
 * ParkingLot 은 향후 공공데이터 API 응답과 동일한 형태를 유지하도록 설계되었습니다.
 * `/data/parking_lots.json` 을 이 타입으로 그대로 파싱하며, 실제 서비스 전환 시에는
 * lib/parking/parkingRepository.ts 의 fetchParkingLots 구현부만 API 호출로 교체하면 됩니다.
 */

/**
 * 자치구/시군구명.
 * 지역이 늘어날 때마다(현재 대전, 추후 다른 시/도) 실제 공공데이터를 사용하므로
 * 고정된 목록 대신 문자열로 둡니다.
 */
export type District = string;

/** 혼잡도 단계 */
export type CongestionLevel = 'available' | 'moderate' | 'congested' | 'full';

/** 주차장 유형 (노외: 별도 부지의 주차장 / 노상: 도로 위 구간 주차장) */
export type ParkingLotType = 'offStreet' | 'onStreet';

/** 주차장 원본 데이터 (parking_lots.json 스키마) */
export interface ParkingLot {
  /** 고유 ID (slug 형태) */
  id: string;
  /** 주차장명 */
  name: string;
  /** 소속 자치구 */
  district: District;
  /** 도로명 주소 */
  address: string;
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
  /** 운영시간 (예: "24시간", "09:00~22:00") */
  operationHours: string;
  /** 요금 안내 (예: "10분당 500원") */
  fee: string;
  /** 총 주차면수 */
  totalSpaces: number;
  /** 현재 가능 면수 (대전광역시 실시간 주차장 API 값) */
  availableSpaces: number;
  /** 마지막 업데이트 시각 (ISO 8601) */
  updatedAt: string;
  /** 주차장 유형 (노외/노상) */
  type: ParkingLotType;
}

/** 위/경도 좌표 쌍 */
export interface LatLng {
  lat: number;
  lng: number;
}

/** 혼잡도 단계별 표시 정보 (색상/라벨은 디자인 가이드와 1:1 매칭) */
export interface CongestionMeta {
  level: CongestionLevel;
  label: '여유' | '보통' | '혼잡' | '만차';
  /** Tailwind 색상 클래스에 대응하는 HEX (지도 마커 등 non-Tailwind 컨텍스트용) */
  color: string;
  emoji: '🟢' | '🟡' | '🔴' | '⚫';
}

/** 데이터 로딩 상태를 표현하는 공용 유니언 (훅에서 재사용) */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
