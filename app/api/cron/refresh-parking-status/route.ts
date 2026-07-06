import { NextResponse } from 'next/server';
import { getCongestionLevel, getCongestionMetaByLevel } from '@/lib/parking/congestion';
import { REGION_ADAPTERS } from '@/lib/regions';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * 지역별 실시간 주차 상태 갱신 크론 엔드포인트.
 * vercel.json 의 crons 설정으로 주기 호출되며, 등록된 각 지역 어댑터(lib/regions)를
 * 순회해 최신 상태를 parking_status 테이블에 upsert 합니다.
 *
 * 지역 하나가 실패해도 다른 지역 갱신에 영향이 없도록 각각 독립적으로 처리합니다.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const ranAt = new Date().toISOString();

  const results = await Promise.all(
    REGION_ADAPTERS.map(async (region) => {
      try {
        const statuses = await region.fetchLiveStatuses();
        if (statuses.length === 0) {
          return { region: region.id, updated: 0, error: null };
        }

        const rows = statuses.map((status) => ({
          parking_lot_id: status.parkingLotId,
          total_spaces: status.totalSpaces,
          available_spaces: status.availableSpaces,
          status: getCongestionMetaByLevel(
            getCongestionLevel(status.totalSpaces, status.availableSpaces)
          ).label,
          updated_at: ranAt,
        }));

        const { error } = await supabase
          .from('parking_status')
          .upsert(rows, { onConflict: 'parking_lot_id' });
        if (error) throw error;

        return { region: region.id, updated: rows.length, error: null };
      } catch (err) {
        return {
          region: region.id,
          updated: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );

  return NextResponse.json({ ranAt, results });
}
