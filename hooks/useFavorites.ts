'use client';

import { useCallback, useEffect, useState } from 'react';
import { addFavorite, listFavorites, removeFavorite } from '@/lib/supabase/favorites';

/**
 * 즐겨찾기 상태 관리 훅.
 *
 * Supabase의 favorites 테이블(database/schema.sql)과 직접 동기화합니다.
 * 토글 시 UI를 먼저 낙관적으로 갱신하고, 서버 요청이 실패하면 원래 상태로 되돌립니다
 * (toggleFavorite 은 실패 시 예외를 다시 던지므로, 호출부에서 에러 토스트 등을 표시할 수 있습니다).
 */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listFavorites()
      .then((records) => {
        if (cancelled) return;
        setFavoriteIds(records.map((record) => record.parking_lot_id));
      })
      .catch((err) => {
        console.warn('[useFavorites] 즐겨찾기 목록을 불러오지 못했습니다:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback((parkingLotId: string) => favoriteIds.includes(parkingLotId), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (parkingLotId: string): Promise<boolean> => {
      const wasFavorite = favoriteIds.includes(parkingLotId);
      const nextIsFavorite = !wasFavorite;

      // 낙관적 업데이트: 서버 응답을 기다리지 않고 즉시 UI에 반영합니다.
      setFavoriteIds((prev) => (wasFavorite ? prev.filter((id) => id !== parkingLotId) : [...prev, parkingLotId]));

      try {
        if (wasFavorite) {
          await removeFavorite(parkingLotId);
        } else {
          await addFavorite(parkingLotId);
        }
        return nextIsFavorite;
      } catch (err) {
        // 실패 시 낙관적 업데이트를 롤백합니다.
        setFavoriteIds((prev) => (wasFavorite ? [...prev, parkingLotId] : prev.filter((id) => id !== parkingLotId)));
        throw err;
      }
    },
    [favoriteIds]
  );

  return { favoriteIds, isFavorite, toggleFavorite, isLoaded };
}
