-- ============================================================================
-- ParkSense Database Schema
-- Supabase Project ID: ucuqphqplzjywegngmsm
--
-- 이 스크립트는 Supabase SQL Editor에서 그대로 실행할 수 있습니다.
-- (Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run)
-- 실행 순서: 1) schema.sql (이 파일)  →  2) seed.sql (data/parking_lots.json 데이터 적재)
--
-- 설계 메모
-- - parking_lots.id 는 UUID 자동 생성 대신 TEXT 로 설계했습니다. `/data/parking_lots.json`
--   의 `id` 필드(예: "gangnam-01")를 그대로 기본키로 사용해야 프런트엔드 상태값
--   (선택된 마커 id, 즐겨찾기 id 등)과 DB 레코드가 항상 1:1로 어긋남 없이 매칭되고,
--   seed.sql 로 재적재(upsert)할 때도 안정적인 키로 사용할 수 있기 때문입니다.
-- - 애플리케이션의 실시간 지도 렌더링은 여전히 `/data/parking_lots.json` 하나만 읽습니다
--   (requirements.md 10). 이 DB는 (1) 즐겨찾기/길찾기 로그의 참조 무결성(FK)을 보장하고,
--   (2) 향후 parking_status 를 실시간 API 로 교체할 때 애플리케이션 코드 변경을 최소화하기
--   위한 백엔드 저장소입니다. (lib/supabase/parkingLots.ts 참고)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. parking_lots: 주차장 기본 정보
-- ----------------------------------------------------------------------------
create table if not exists public.parking_lots (
  id text primary key,
  name text not null,
  -- 서울 전역(추후 전국)의 실제 자치구/시군구명이 들어오므로 고정 목록 체크 제약은 두지 않습니다.
  district text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  operation_hours text not null,
  fee text not null,
  type text not null default 'offStreet' check (type in ('offStreet', 'onStreet')),
  created_at timestamptz not null default now()
);

comment on table public.parking_lots is '서울 공영주차장 기본 정보 (id는 data/parking_lots.json 의 slug와 동일)';

-- ----------------------------------------------------------------------------
-- 2. parking_status: 현재(현재는 샘플) 혼잡도 및 가능 주차면수
--    주차장당 "현재 상태" 1행만 유지합니다 (parking_lot_id UNIQUE).
--    실시간 API 연동 시 upsert(on conflict) 로 이 한 행만 갱신하면 됩니다.
-- ----------------------------------------------------------------------------
create table if not exists public.parking_status (
  id uuid primary key default gen_random_uuid(),
  parking_lot_id text not null references public.parking_lots (id) on delete cascade,
  total_spaces integer not null check (total_spaces >= 0),
  available_spaces integer not null check (available_spaces >= 0 and available_spaces <= total_spaces),
  status text not null check (status in ('여유', '보통', '혼잡', '만차')),
  updated_at timestamptz not null default now(),
  constraint parking_status_parking_lot_id_key unique (parking_lot_id)
);

comment on table public.parking_status is '주차장별 현재 상태 (실시간 API 연동 시 이 테이블만 upsert 갱신하면 됨)';

-- ----------------------------------------------------------------------------
-- 3. favorites: 즐겨찾기
--    로그인 시스템이 없는 MVP 단계라 전체 방문자가 공유하는 즐겨찾기 목록입니다.
--    주차장당 중복 즐겨찾기를 막기 위해 parking_lot_id 를 UNIQUE 로 둡니다.
-- ----------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  parking_lot_id text not null references public.parking_lots (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_parking_lot_id_key unique (parking_lot_id)
);

comment on table public.favorites is '즐겨찾기 (계정 시스템 도입 시 user_id 컬럼 추가 및 unique 제약을 (user_id, parking_lot_id) 로 변경 예정)';

-- ----------------------------------------------------------------------------
-- 4. navigation_events: 길찾기 버튼 클릭 로그
-- ----------------------------------------------------------------------------
create table if not exists public.navigation_events (
  id uuid primary key default gen_random_uuid(),
  parking_lot_id text not null references public.parking_lots (id) on delete cascade,
  clicked_at timestamptz not null default now()
);

comment on table public.navigation_events is '길찾기 버튼 클릭 로그 (인기 주차장 분석 등에 활용)';

create index if not exists navigation_events_parking_lot_id_idx on public.navigation_events (parking_lot_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- parking_lots / parking_status: 누구나 읽을 수 있어야 지도에 표시할 수 있으므로
-- anon 역할에 SELECT 를 허용합니다. 쓰기(seed.sql 적재, 향후 실시간 갱신)는 SQL
-- Editor 또는 서비스 역할 키로만 수행하므로 anon 대상 쓰기 정책은 추가하지 않습니다.
--
-- favorites / navigation_events: 로그인 시스템이 없는 MVP 단계이므로 anon 역할의
-- INSERT/SELECT/DELETE 를 허용합니다. 사용자 계정이 도입되면 user_id 기준으로
-- 정책을 좁혀야 합니다.
-- ----------------------------------------------------------------------------
alter table public.parking_lots enable row level security;
alter table public.parking_status enable row level security;
alter table public.favorites enable row level security;
alter table public.navigation_events enable row level security;

create policy "parking_lots_public_read" on public.parking_lots
  for select to anon, authenticated using (true);

create policy "parking_status_public_read" on public.parking_status
  for select to anon, authenticated using (true);

create policy "favorites_public_read" on public.favorites
  for select to anon, authenticated using (true);

create policy "favorites_public_insert" on public.favorites
  for insert to anon, authenticated with check (true);

create policy "favorites_public_delete" on public.favorites
  for delete to anon, authenticated using (true);

create policy "navigation_events_public_insert" on public.navigation_events
  for insert to anon, authenticated with check (true);
