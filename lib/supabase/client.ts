import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 연동 정보.
 *
 * docs/supabase-info.md.md 의 명시적 지침에 따라 .env.local 을 생성하지 않고
 * 프로젝트 정보를 코드에 직접 사용합니다. Publishable Key는 브라우저에 노출되어도
 * 안전하도록 설계된 공개 키(anon key 역할)이므로 클라이언트 코드에 포함해도 무방합니다.
 *
 * 지도에 표시되는 주차장 기본 정보/상태는 이 클라이언트로 Supabase(parking_lots +
 * parking_status)에서 조회하며(lib/supabase/parkingLots.ts), parking_status 는
 * app/api/cron/refresh-parking-status 크론이 지역 실시간 API로 주기 갱신합니다.
 * 즐겨찾기(favorites)와 길찾기 클릭 로그(navigation_events)도 이 클라이언트로
 * Supabase와 실시간으로 동기화됩니다. (database/schema.sql, database/seed.sql 참고)
 */
const SUPABASE_PROJECT_ID = 'ucuqphqplzjywegngmsm';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_AY9i6W1RYFVyt4PfTGFMXA_cN0oliNj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
  },
});
