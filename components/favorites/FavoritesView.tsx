'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { ParkingListItem } from '@/components/common/ParkingListItem';
import { Spinner } from '@/components/common/Spinner';
import { getDistanceInMeters } from '@/utils/distance';
import type { LatLng, ParkingLot } from '@/types/parking';

interface FavoritesViewProps {
  favoriteLots: ParkingLot[];
  isLoaded: boolean;
  userLocation: LatLng | null;
  onToggleFavorite: (lot: ParkingLot) => void;
  onSelectLot: (lot: ParkingLot) => void;
}

/** "즐겨찾기" 탭: Supabase favorites 테이블에 저장된 주차장 목록 */
export function FavoritesView({ favoriteLots, isLoaded, userLocation, onToggleFavorite, onSelectLot }: FavoritesViewProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <header className="border-b border-divider px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-lg font-bold text-text-primary">즐겨찾기</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+88px)]">
        {!isLoaded ? (
          <div className="flex justify-center pt-16">
            <Spinner />
          </div>
        ) : favoriteLots.length === 0 ? (
          <EmptyState
            icon="⭐"
            title="즐겨찾기한 주차장이 없어요"
            description="주차장 상세 정보에서 별 아이콘을 눌러 추가해보세요."
            className="pt-16"
          />
        ) : (
          <ul>
            {favoriteLots.map((lot) => (
              <ParkingListItem
                key={lot.id}
                lot={lot}
                distanceMeters={
                  userLocation ? getDistanceInMeters(userLocation, { lat: lot.lat, lng: lot.lng }) : undefined
                }
                isFavorite
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
