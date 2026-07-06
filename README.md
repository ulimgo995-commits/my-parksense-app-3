# 🅿️ ParkSense

목적지 기반 주차장 혼잡도 안내 서비스 — 주차장의 혼잡도를 지도에서 색상으로 바로 확인하고, 가장 적합한 주차장을 빠르게 찾을 수 있도록 도와주는 지도 기반 웹 서비스입니다.

## 1. 프로젝트 소개

현재 대부분의 지도 서비스는 주차장의 위치는 제공하지만, 지금 얼마나 여유가 있는지는 직관적으로 확인하기 어렵습니다. ParkSense는 지도 위 마커 색상만으로 혼잡도(여유/보통/혼잡/만차)를 즉시 파악할 수 있게 하여, 운전자가 주차장을 찾아 헤매는 시간을 줄여줍니다.

이번 버전은 **대전광역시 실시간 주차장 13곳**(대전광역시_실시간 주차장 정보 API 기반, 위치·요금·운영시간뿐 아니라 실시간 잔여면수까지 실제 데이터)을 대상으로 하며, 향후 다른 시/도 실시간 API 추가 연동 및 확장을 고려하여 설계되었습니다.

## 2. 기술 스택

| 영역 | 기술 |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Style | Tailwind CSS |
| Map | Kakao Maps JavaScript SDK |
| Backend | Supabase (`@supabase/supabase-js`) |
| Deployment | Vercel |

## 3. 설치 방법

### 3-1. 설치

```bash
npm install
```

### 3-2. Kakao Maps API 키 설정 (필수)

1. [Kakao Developers](https://developers.kakao.com/console/app) 에서 애플리케이션을 생성합니다.
2. `내 애플리케이션 > 앱 키 > JavaScript 키`를 복사합니다.
3. `내 애플리케이션 > 플랫폼 > Web` 에 사용할 도메인을 등록합니다. (예: `http://localhost:3000`, 배포 도메인)
4. 프로젝트 루트의 `.env.local.example` 파일을 복사해 `.env.local` 파일을 만들고 키를 입력합니다.

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_KAKAO_MAP_API_KEY=발급받은_JavaScript_키
```

> Supabase 연동 정보는 `docs/supabase-info.md.md` 에 명시된 프로젝트 정보를 `lib/supabase/client.ts` 에서 직접 사용하므로 별도의 `.env.local` 설정이 필요하지 않습니다.

### 3-3. Supabase 테이블 생성 및 초기 데이터 적재 (필수 — 즐겨찾기/길찾기 로그 기능에 필요)

즐겨찾기·길찾기 로그 기능은 Supabase 테이블이 존재해야 정상 동작합니다.

1. [Supabase SQL Editor](https://supabase.com/dashboard/project/ucuqphqplzjywegngmsm/sql/new) 접속
2. `database/schema.sql` 내용을 붙여넣고 실행 (테이블 4개 + 외래키 + RLS 정책 생성)
3. `database/seed.sql` 내용을 붙여넣고 실행 (`data/parking_lots.json` 의 13개 주차장을 `parking_lots`/`parking_status` 테이블에 적재)

`seed.sql` 은 실행 시작 시 `parking_lots` 테이블을 `truncate ... cascade` 로 비운 뒤 새로 적재합니다(이전 지역 데이터가 남아있으면 함께 삭제됩니다). 이후 재실행 시에는 `on conflict ... do update` 로 upsert 되어 안전합니다.

### 3-4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

### 3-5. 빌드 / 배포

```bash
npm run build
npm run start
```

## 4. 프로젝트 구조

```
parksense/
├── app/                      # Next.js App Router 엔트리
│   ├── layout.tsx            # 루트 레이아웃 (폰트, ToastProvider)
│   ├── page.tsx              # Home 페이지 (HomeScreen 렌더링)
│   ├── error.tsx             # 전역 에러 바운더리
│   └── globals.css           # Tailwind 진입점 + 전역 스타일
├── components/
│   ├── home/                 # Home 화면 조립 (상태 관리, 탭 전환)
│   ├── map/                  # 카카오맵, 현재 위치 버튼, 범례, 이 지역 검색, 로딩/에러 UI
│   ├── search/                # 검색창 + 자동완성 + 필터 바(칩/모달)
│   ├── bottom-sheet/          # Bottom Sheet / Desktop 패널, 상세 정보, 혼잡도 추이 차트
│   ├── nearby/                 # "내 주변" 탭 (거리순 목록)
│   ├── favorites/               # "즐겨찾기" 탭
│   ├── profile/                  # "내 정보" 탭
│   ├── navigation/                # 하단 탭바
│   ├── permission/                 # 위치 권한 안내 배너
│   └── common/                      # Button, Skeleton, Toast, 아이콘, 목록 아이템 등 공용 UI
├── hooks/                     # useGeolocation, useKakaoLoader, useParkingLots, useParkingFilters,
│                              # useBottomSheet, useFavorites, useDebounce, useMediaQuery 등
├── lib/
│   ├── kakao/                 # Kakao SDK 로더, 마커/경로선 DOM 팩토리
│   ├── parking/                # 혼잡도 계산, 주차 유형, 데이터 접근 계층(Repository)
│   └── supabase/               # Supabase 클라이언트 + 즐겨찾기/길찾기 로그 CRUD
├── types/                      # ParkingLot 등 도메인 타입, 탭 타입, Kakao SDK 타입 선언
├── utils/                       # 거리/ETA 계산, 포맷터, 요금 파싱, 시간대별 추이·소셜 카운트 샘플 생성 등
├── data/
│   └── parking_lots.json       # 주차장 데이터 단일 소스 (요구사항 10)
├── database/
│   ├── schema.sql               # Supabase 테이블 정의 (SQL, 외래키 포함)
│   └── seed.sql                  # parking_lots.json 기반 초기 데이터 적재 스크립트
└── docs/                         # 요구사항 / 디자인 가이드 / 연동 정보 문서
```

## 5. 주요 기능

- **현재 위치 기반 지도**: Geolocation API로 현재 위치를 가져와 지도 중심을 이동하고, 파란색 펄스 마커로 표시합니다.
- **혼잡도 마커**: 여유(🟢)/보통(🟡)/혼잡(🔴)/만차(⚫) 4단계로 색상이 구분된 핀 마커 아래 "가능 면수 + 상태" 라벨을 함께 표시하며, 클릭 시 확대 + Bounce 애니메이션이 적용됩니다.
- **필터 바**: 실시간 주차 가능(혼잡도)/요금/운영시간/주차 유형(노외·노상)을 칩 드롭다운 또는 통합 필터 패널로 조합해 지도·검색 결과를 동시에 좁힐 수 있습니다.
- **이 지역 검색**: 지도를 드래그하면 플로팅 버튼이 나타나 현재 화면 범위 안의 주차장 개수를 바로 확인할 수 있습니다.
- **경로선 + 도착 예상 시간**: 주차장을 선택하면 현재 위치까지 직선 경로와 "도착까지 N분 · 거리" 카드를 지도 위에 표시합니다 (실제 도로 경로 API 대신 직선거리 기반 근사치).
- **Bottom Sheet / Desktop 패널**: 주차장명, 주소, 실시간 업데이트(새로고침), 현재 가능 면수, **24시간 혼잡도 추이 그래프**, 운영시간·요금·총면수·**길찾기 중인 사람 수**, 길찾기/즐겨찾기 버튼을 보여줍니다. 모바일에서는 드래그로 collapsed(42%)/expanded(88%) 상태를 전환할 수 있고("상세 정보 보기" 버튼으로도 확장 가능), 데스크톱에서는 지도와 동시에 볼 수 있는 고정 패널로 표시됩니다.
- **하단 탭 내비게이션**: 주차장 찾기 / 내 주변(거리순 목록) / 즐겨찾기 / 내 정보 4개 탭으로 화면을 전환하며, 지도는 탭 전환 시에도 다시 로드되지 않도록 상태를 유지합니다.
- **검색 & 자동완성**: 주차장명/주소로 검색하면 실시간 자동완성 결과가 나타나고, 선택 시 해당 마커로 지도가 이동합니다.
- **길찾기 / 즐겨찾기 (Supabase 연동)**: 길찾기 버튼은 카카오맵 길찾기 페이지를 새 탭으로 열면서 `navigation_events` 테이블에 클릭 로그를 남기고, 즐겨찾기 버튼은 `favorites` 테이블에 추가/삭제합니다. 즐겨찾기 상태는 Bottom Sheet·내 주변·즐겨찾기 탭이 하나의 훅(`useFavorites`)을 공유해 항상 일치합니다. (낙관적 업데이트 + 실패 시 롤백/에러 토스트)
- **Loading / Error / Empty 처리**: 지도·검색창 Skeleton UI, 위치 권한 거부/지도 로드 실패/검색·필터 결과 없음/주차장 없음 등 예외 상황에 대한 전용 UI를 제공합니다.
- **반응형 레이아웃**: Mobile → Tablet → Desktop 순으로 자연스럽게 확장되며, `md` 이상에서는 지도와 상세 패널을 동시에 볼 수 있습니다.

> **참고**: 24시간 혼잡도 추이 그래프와 "길찾기 중인 사람 수"는 실시간 이력·사용자 추적 데이터가 없는 MVP 단계라 `utils/congestionTrend.ts`, `utils/socialSignal.ts` 에서 주차장 id 기반 **결정적 샘플 데이터**로 생성합니다 (새로고침해도 값이 바뀌지 않음). 실제 서비스 전환 시 이 두 함수만 실데이터 조회로 교체하면 됩니다.

## 6. 데이터 구조

`data/parking_lots.json` 하나만 애플리케이션의 데이터 소스로 사용합니다 (하드코딩 금지).

이 파일은 **대전광역시_실시간 주차장 정보 API**(`apis.data.go.kr/6300000/pis/parkinglotIF`)에서 받아온 대전 전체 756개 주차장 중, **실시간 잔여면수(`resQty`)가 실제 의미 있는 값으로 제공되는 13곳만 선별**해 생성했습니다. 나머지는 (1) 위치/요금/운영시간 같은 기본 정보만 있고 실시간 값이 없거나(`"NONE"`, 740곳) (2) 실시간 필드는 있지만 총면수·잔여면수가 둘 다 0으로 내려와 데이터를 신뢰할 수 없는 경우(3곳)라 제외했습니다. 이름/주소/좌표/총면수/요금/운영시간과 **실시간 가능면수 모두 실제 API 응답값**입니다(샘플/랜덤 데이터 없음).

> 참고: 이 API는 공영/민영 구분 필드가 없어, 13곳 중 "NJ타워 주차장"은 이름상 민간 건물 부설 주차장으로 보입니다.

```ts
interface ParkingLot {
  id: string;
  name: string;
  district: string; // 대전 자치구명 (예: "서구") — 다른 시/도 확장을 고려해 고정 목록 대신 문자열
  address: string;
  lat: number;
  lng: number;
  operationHours: string;
  fee: string;
  totalSpaces: number;
  availableSpaces: number;
  updatedAt: string; // ISO 8601
  type: 'offStreet' | 'onStreet'; // 노외 / 노상 (필터 바에서 사용)
}
```

혼잡도는 저장된 값이 아니라 `lib/parking/congestion.ts` 의 `getCongestionLevel(total, available)` 함수로 항상 실시간 계산합니다.

- 여유: 가능면수 비율 60% 이상
- 보통: 30 ~ 59%
- 혼잡: 1 ~ 29%
- 만차: 0면

## 7. Supabase 연동

`lib/supabase/client.ts` 는 `docs/supabase-info.md.md` 에 명시된 프로젝트 URL(`https://ucuqphqplzjywegngmsm.supabase.co`)과 Publishable Key를 코드에 직접 사용해 연결되어 있습니다 (`.env.local` 미생성).

### 테이블 (database/schema.sql)

| 테이블 | 용도 | 비고 |
| --- | --- | --- |
| `parking_lots` | 주차장 기본 정보 (노외/노상 유형 포함) | `id` 는 `data/parking_lots.json` 의 slug(text)를 그대로 기본키로 사용 |
| `parking_status` | 현재 혼잡도/가능면수 | `parking_lot_id` UNIQUE — 주차장당 "현재 상태" 1행만 유지, 크론이 주기적으로 upsert 갱신 |
| `favorites` | 즐겨찾기 | `parking_lot_id` UNIQUE — 중복 즐겨찾기 방지 |
| `navigation_events` | 길찾기 클릭 로그 | 집계/분석용 |

4개 테이블 모두 `parking_lots(id)` 를 참조하는 외래키(`on delete cascade`)가 걸려 있어, 주차장이 삭제되면 관련 상태/즐겨찾기/로그도 함께 정리됩니다.

### 실제 연동된 기능

- **즐겨찾기 CRUD**: `lib/supabase/favorites.ts`(`listFavorites`/`addFavorite`/`removeFavorite`) ↔ `hooks/useFavorites.ts` — Bottom Sheet의 즐겨찾기 버튼과 실시간으로 연결되어 있으며, 낙관적 업데이트 후 실패 시 자동 롤백 + 에러 토스트를 표시합니다.
- **길찾기 로그**: `lib/supabase/navigationEvents.ts`(`logNavigationEvent`) — Bottom Sheet의 길찾기 버튼 클릭 시 카카오맵 새 탭을 먼저 열고(팝업 차단 방지), 이어서 비동기로 `navigation_events` 에 기록합니다. 실패해도 사용자 흐름을 막지 않습니다.
- **초기 데이터 적재**: `database/seed.sql` 이 `data/parking_lots.json` 의 13개 주차장을 `parking_lots`/`parking_status` 에 upsert 합니다 (즐겨찾기·길찾기 로그의 외래키 무결성을 위해 선행되어야 합니다).
- **실시간 조회**: `lib/supabase/parkingLots.ts`(`fetchParkingLotsFromSupabase`)가 `parking_lots` + `parking_status` 를 조인해 `ParkingLot[]` 를 반환하며, `lib/parking/parkingRepository.ts` 가 이 함수를 호출합니다. 즉 지도 렌더링은 정적 JSON이 아니라 **Supabase에서 실시간으로 조회**합니다.

### 실시간 자동 갱신 (크론)

- `app/api/cron/refresh-parking-status/route.ts` 가 `lib/regions/` 에 등록된 지역 어댑터(현재 대전 1곳)를 순회해 각 지역 API를 호출하고, 결과를 `parking_status` 테이블에 upsert 합니다.
- `vercel.json` 의 `crons` 설정으로 Vercel이 이 엔드포인트를 주기 호출합니다 (기본 10분 간격). **Vercel 무료(Hobby) 플랜은 Cron Job 실행 빈도가 하루 1회로 제한됩니다** — 더 자주 갱신하려면 Pro 플랜이 필요합니다. Hobby 플랜이라면 하루 1번만 갱신되는 게 정상입니다.
- 이 라우트는 서비스 역할 키 없이 기존 Publishable Key로 직접 `parking_status` 에 씁니다. 이를 위해 `database/schema.sql` 에 `parking_status_public_insert`/`parking_status_public_update` 정책을 추가했습니다 — **이미 schema.sql을 실행하셨다면 아래 두 정책 구문만 Supabase SQL Editor에서 추가로 실행**해주세요.

```sql
create policy "parking_status_public_insert" on public.parking_status
  for insert to anon, authenticated with check (true);

create policy "parking_status_public_update" on public.parking_status
  for update to anon, authenticated using (true) with check (true);
```

- (선택) 아무나 이 엔드포인트를 호출하지 못하도록 Vercel 프로젝트 환경변수에 `CRON_SECRET` (임의의 문자열)을 추가하면, 그 값과 일치하는 `Authorization: Bearer <값>` 헤더가 없는 요청은 401로 거부합니다. Vercel Cron은 이 헤더를 자동으로 붙여서 호출합니다.
- 지역을 추가할 때는 `lib/regions/<지역>.ts` 에 `RegionAdapter`(이름→id 매칭, API 호출·파싱)를 구현하고 `lib/regions/index.ts` 의 `REGION_ADAPTERS` 배열에 등록하기만 하면 됩니다. 스케줄러·에러 격리·Supabase upsert 로직은 공용이라 다시 만들 필요가 없습니다.

## 8. 향후 확장 계획

- **다른 지역 실시간 API 연동**: 국가 통합 API(한국교통안전공단 `B553881`)는 위치정보 API와 실시간 API의 식별번호 체계가 서로 달라 직접 매칭이 안 되고, 현재는 서비스 자체도 502 오류로 응답하지 않습니다. 대신 **지자체별로 개별 제공하는 API**(예: 대전광역시 `6300000/pis/parkinglotIF`)는 위치정보와 실시간 잔여면수가 하나의 응답에 함께 들어있어 매칭 문제가 없습니다. 다른 시/도도 data.go.kr에서 지자체명으로 검색해 유사한 API를 찾아 `lib/regions/`에 어댑터로 추가하는 방식으로 확장합니다. (강원특별자치도 강릉시 `4201000/GNitsTrafficInfoService_1.0` 도 확인 중 — 승인 직후 전파 지연으로 재시도 필요)
- **지역별 실시간 비율 편차 고려**: 대전은 전체 756곳 중 13곳(약 1.7%)만 의미 있는 실시간 값이 제공되어, 이번 버전은 그 13곳만 반영했습니다. 지역을 추가할 때마다 전체 중 실시간 제공 비율을 먼저 확인하고, 기본 정보만 있는(또는 값이 비어있는) 나머지를 포함할지 여부를 판단해야 합니다.
- **다중 지역 확장 시 성능**: 앱은 Supabase에서 `parking_lots`/`parking_status` 를 조회해 렌더링하므로, 지역을 몇 개를 추가하든 프런트엔드 구조 자체는 그대로입니다. 다만 전국 약 18,530곳처럼 규모가 커지면 모든 마커를 한 번에 DOM으로 렌더링하기 어려우므로, 이미 구현된 `lib/kakao/clustering.ts` 격자 클러스터링(줌 레벨에 따라 숫자 묶음 ↔ 개별 마커 전환, "이 지역 검색" 클릭 시에만 갱신)을 계속 활용합니다.
- **서비스 역할 키로 전환**: 지금은 MVP 단계라 크론이 Publishable Key + 열린 RLS로 `parking_status` 에 씁니다. 정식 서비스 전환 시에는 Supabase 서비스 역할 키를 Vercel 환경변수로 관리하고 크론 라우트에서만 사용하도록 바꾼 뒤, `parking_status_public_insert`/`_update` anon 정책은 제거하는 것을 권장합니다.
- **회원 시스템 & 개인화된 즐겨찾기**: 현재 `favorites` 는 로그인 없이 전체 방문자가 공유하는 목록입니다. 인증 도입 시 `favorites` 에 `user_id` 컬럼을 추가하고 unique 제약을 `(user_id, parking_lot_id)` 로 변경하면 사용자별 즐겨찾기로 승격할 수 있습니다.
- **인기 주차장 분석**: `navigation_events` 로그를 집계하여 인기 주차장 추천, 혼잡 예측 등 부가 기능으로 확장할 수 있습니다.
- **서버 사이드 쓰기 강화**: 현재 `parking_lots`/`parking_status` 는 SQL Editor(또는 서비스 역할 키)로만 쓸 수 있도록 RLS가 설계되어 있습니다. 실시간 수집 파이프라인을 붙일 때는 Supabase Edge Function이나 서버리스 크론에서 서비스 역할 키로 갱신하는 구조를 권장합니다.
