import type { ParkingLot } from '@/types/parking';

/**
 * 마커 격자 클러스터링.
 *
 * 카카오맵 공식 MarkerClusterer는 kakao.maps.Marker(이미지 마커)만 묶을 수 있어서,
 * 우리 앱처럼 CustomOverlay(면수/상태 라벨이 포함된 DOM 마커)를 쓰는 경우엔 그대로
 * 사용할 수 없습니다. 대신 지도 레벨(줌)에 따라 위경도를 격자로 나눠 묶는 간단한
 * 방식을 직접 구현했습니다.
 *
 * 격자 크기는 실제 화면에서 마커가 겹치지 않을 정도로 대략 맞춘 값이라, 실제
 * 배포 후 화면을 보면서 MIN_CLUSTER_LEVEL / BASE_CELL_DEG 값을 조정하는 걸 권장합니다.
 */

/** 이 레벨보다 더 확대(숫자가 작음)되어 있으면 클러스터링하지 않고 전부 개별 마커로 표시 */
const MIN_CLUSTER_LEVEL = 6;

/** MIN_CLUSTER_LEVEL 기준 격자 한 칸의 크기(위경도 degree) */
const BASE_CELL_DEG = 0.006;

/** 레벨이 1 커질 때마다(축소될 때마다) 격자를 이 배수만큼 넓힙니다 */
const LEVEL_GROWTH_FACTOR = 1.7;

export interface LotCluster {
  /** 같은 줌 레벨 + 같은 격자 칸이면 항상 동일한 값 (마커 재사용을 위한 안정적인 key) */
  key: string;
  lat: number;
  lng: number;
  lots: ParkingLot[];
}

export interface ClusterResult {
  /** 개별 마커로 표시할 주차장 */
  singles: ParkingLot[];
  /** 클러스터(묶음)로 표시할 그룹 */
  clusters: LotCluster[];
}

function getGridSizeDeg(level: number): number {
  return BASE_CELL_DEG * Math.pow(LEVEL_GROWTH_FACTOR, level - MIN_CLUSTER_LEVEL);
}

/**
 * @param lots 현재 화면(뷰포트)에 보이는 주차장 목록
 * @param level 카카오맵 현재 레벨 (작을수록 확대)
 * @param alwaysSingleIds 클러스터링 대상에서 제외하고 항상 개별 마커로 표시할 id (선택된 마커 등)
 */
export function clusterLots(
  lots: ParkingLot[],
  level: number,
  alwaysSingleIds: ReadonlySet<string> = new Set()
): ClusterResult {
  if (level < MIN_CLUSTER_LEVEL) {
    return { singles: lots, clusters: [] };
  }

  const cellSize = getGridSizeDeg(level);
  const buckets = new Map<string, ParkingLot[]>();

  for (const lot of lots) {
    const gx = Math.floor(lot.lat / cellSize);
    const gy = Math.floor(lot.lng / cellSize);
    const key = `${level}:${gx}:${gy}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(lot);
    else buckets.set(key, [lot]);
  }

  const singles: ParkingLot[] = [];
  const clusters: LotCluster[] = [];

  buckets.forEach((group, key) => {
    const forcedSingles = group.filter((lot) => alwaysSingleIds.has(lot.id));
    const rest = group.filter((lot) => !alwaysSingleIds.has(lot.id));
    singles.push(...forcedSingles);

    if (rest.length === 1) {
      const only = rest[0];
      if (only) singles.push(only);
    } else if (rest.length > 1) {
      const lat = rest.reduce((sum, lot) => sum + lot.lat, 0) / rest.length;
      const lng = rest.reduce((sum, lot) => sum + lot.lng, 0) / rest.length;
      clusters.push({ key, lat, lng, lots: rest });
    }
  });

  return { singles, clusters };
}
