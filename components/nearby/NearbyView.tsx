'use client';

import { useMemo } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { ParkingListItem } from '@/components/common/ParkingListItem';
import { getDistanceInMeters } from '@/utils/distance';
import type { LatLng, ParkingLot } from '@/types/parking';

interface NearbyViewProps {
  parkingLots: ParkingLot[];
  userLocation: LatLng | null;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (lot: ParkingLot) => void;
  onSelectLot: (lot: ParkingLot) => void;
}

/** "내 주변" 탭: 현재 위치 기준 거리순으로 정렬된 주차장 목록 */
export function NearbyView({ parkingLots, userLocation, isFavorite, onToggleFavorite, onSelectLot }: NearbyViewProps) {
  const sortedLots = useMemo(() => {
    if (!userLocation) return parkingLots;
    return [...parkingLots].sort(
      (a, b) =>
        getDistanceInMeters(userLocation, { lat: a.lat, lng: a.lng }) -
        getDistanceInMeters(userLocation, { lat: b.lat, lng: b.lng })
    );
  }, [parkingLots, userLocation]);

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="border-b border-divider px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-lg font-bold text-text-primary">내 주변</h1>
        {!userLocation && (
          <p className="mt-1 text-xs text-text-secondary">현재 위치를 확인할 수 없어 전체 주차장을 보여드려요.</p>
        )}
      </header>
      <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+88px)]">
        {sortedLots.length === 0 ? (
          <EmptyState icon="🅿️" title="표시할 주차장이 없어요" className="pt-16" />
        ) : (
          <ul>
            {sortedLots.map((lot) => (
              <ParkingListItem
                key={lot.id}
                lot={lot}
                distanceMeters={
                  userLocation ? getDistanceInMeters(userLocation, { lat: lot.lat, lng: lot.lng }) : undefined
                }
                isFavorite={isFavorite(lot.id)}
                onSelect={onSelectLot}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
