import { supabase } from '@/lib/supabase/client';

/**
 * 즐겨찾기 CRUD (database/schema.sql 의 favorites 테이블 기준).
 * hooks/useFavorites.ts 에서 직접 호출하여 즐겨찾기 추가/삭제/조회를 Supabase와 동기화합니다.
 *
 * 현재는 로그인 시스템이 없어 전체 방문자가 공유하는 즐겨찾기 목록이며,
 * favorites.parking_lot_id 는 UNIQUE 제약이 걸려 있어 addFavorite 은 upsert로
 * 안전하게 중복 없이 동작합니다. 계정 시스템 도입 시 user_id 컬럼을 추가하고
 * 이 모듈의 쿼리에 user_id 필터만 더하면 됩니다.
 */
export interface FavoriteRecord {
  id: string;
  parking_lot_id: string;
  created_at: string;
}

export async function listFavorites(): Promise<FavoriteRecord[]> {
  const { data, error } = await supabase.from('favorites').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function addFavorite(parkingLotId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .upsert({ parking_lot_id: parkingLotId }, { onConflict: 'parking_lot_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeFavorite(parkingLotId: string): Promise<void> {
  const { error } = await supabase.from('favorites').delete().eq('parking_lot_id', parkingLotId);
  if (error) throw error;
}
