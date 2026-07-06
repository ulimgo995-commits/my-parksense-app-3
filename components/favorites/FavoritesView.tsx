'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
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

/** "즐겨찾기" 화면: Supabase favorites 테이블에 저장된 주차장 목록 */
export function FavoritesView({ favoriteLots, isLoaded, userLocation, onToggleFavorite, onSelectLot }: FavoritesViewProps) {
  const router = useRouter();

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col bg-white">
      <header className="border-b border-divider px-5 pb-4 pt-6">
        <h1 className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <span className="text-primary">♥</span> 즐겨찾기
        </h1>
        <p className="mt-1 text-xs text-text-secondary">자주 이용하는 주차장을 저장하고 빠르게 확인하세요.</p>
      </header>
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {!isLoaded ? (
          <div className="flex justify-center pt-16">
            <Spinner />
          </div>
        ) : favoriteLots.length === 0 ? (
          <EmptyState
            icon="⭐"
            title="아직 즐겨찾기에 추가한 주차장이 없어요"
            description="주차장을 즐겨찾기에 추가하면 여기에서 빠르게 확인할 수 있어요."
            className="pt-16"
            action={
              <Button variant="primary" className="mt-2" onClick={() => router.push('/parking')}>
                주차장 찾기
              </Button>
            }
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
