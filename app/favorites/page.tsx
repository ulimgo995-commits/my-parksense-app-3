'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FavoritesView } from '@/components/favorites/FavoritesView';
import { useFavorites } from '@/hooks/useFavorites';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useToast } from '@/hooks/useToast';
import type { ParkingLot } from '@/types/parking';

export default function FavoritesPage() {
  const router = useRouter();
  const { parkingLots } = useParkingLots();
  const { position: userLocation } = useGeolocation();
  const { isFavorite, toggleFavorite, isLoaded } = useFavorites();
  const { showToast } = useToast();

  const favoriteLots = useMemo(() => parkingLots.filter((lot) => isFavorite(lot.id)), [parkingLots, isFavorite]);

  const handleToggleFavorite = useCallback(
    async (lot: ParkingLot) => {
      try {
        const nowFavorite = await toggleFavorite(lot.id);
        showToast(
          nowFavorite ? `${lot.name}을(를) 즐겨찾기에 추가했어요` : '즐겨찾기에서 제거했어요',
          nowFavorite ? 'success' : 'default'
        );
      } catch (err) {
        console.warn('[FavoritesPage] 즐겨찾기 처리 실패:', err);
        showToast('즐겨찾기 처리에 실패했어요. 잠시 후 다시 시도해주세요.', 'error');
      }
    },
    [toggleFavorite, showToast]
  );

  const handleSelectLot = useCallback(
    (lot: ParkingLot) => {
      router.push(`/parking?lot=${encodeURIComponent(lot.id)}`);
    },
    [router]
  );

  return (
    <FavoritesView
      favoriteLots={favoriteLots}
      isLoaded={isLoaded}
      userLocation={userLocation}
      onToggleFavorite={handleToggleFavorite}
      onSelectLot={handleSelectLot}
    />
  );
}
