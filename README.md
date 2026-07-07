# 🅿️ ParkFlow

목적지 기반 주차장 혼잡도 안내 서비스 — 주차장의 혼잡도를 지도에서 색상으로 바로 확인하고, 가장 적합한 주차장을 빠르게 찾을 수 있도록 도와주는 지도 기반 웹 서비스입니다. (구 ParkSense)

## 1. 프로젝트 소개

현재 대부분의 지도 서비스는 주차장의 위치는 제공하지만, 지금 얼마나 여유가 있는지는 직관적으로 확인하기 어렵습니다. ParkFlow는 지도 위 마커 색상만으로 혼잡도(여유/보통/혼잡/만차)를 즉시 파악할 수 있게 하여, 운전자가 주차장을 찾아 헤매는 시간을 줄여줍니다.

이번 버전은 **서울특별시 50곳 + 전국공항(한국공항공사) 25곳 + 대전광역시 13곳 + 강원특별자치도 강릉시 13곳 + 경상남도 진주시 5곳, 총 106곳의 실시간 주차장**(지자체·공공기관 실시간 주차장 API 기반, 위치·운영시간뿐 아니라 실시간 잔여면수까지 실제 데이터)을 대상으로 하며, 향후 다른 지역·기관 실시간 API 추가 연동 및 확장을 고려하여 설계되었습니다.

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
3. `database/seed.sql` 내용을 붙여넣고 실행 (`data/parking_lots.json` 의 106개 주차장을 `parking_lots`/`parking_status` 테이블에 적재)

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
├── app/                      # Next.js App Router 엔트리 (페이지별 실제 라우팅)
│   ├── layout.tsx            # 루트 레이아웃 (폰트, ToastProvider, 상단 내비게이션)
│   ├── page.tsx              # "홈" 랜딩 페이지
│   ├── parking/page.tsx      # "주차장 찾기" 페이지
│   ├── favorites/page.tsx    # "즐겨찾기" 페이지
│   ├── guide/page.tsx        # "이용안내" 페이지
│   ├── profile/page.tsx      # "내 정보" 페이지
│   ├── error.tsx             # 전역 에러 바운더리
│   └── globals.css           # Tailwind 진입점 + 전역 스타일
├── components/
│   ├── home/                 # "홈" 랜딩 화면 (히어로 검색 + 통계 배지 + 지도 미리보기)
│   ├── parking-finder/       # "주차장 찾기" 화면 (검색+필터+목록+지도+상세, 구 "내 주변" 통합)
│   ├── map/                  # 카카오맵, 현재 위치 버튼, 범례, 로딩/에러 UI
│   ├── search/                # 검색창(주차장 이름 + 카카오 Places 실제 장소 검색) + 필터 바
│   ├── bottom-sheet/          # Bottom Sheet / Desktop 패널, 상세 정보, 혼잡도 추이 차트
│   ├── favorites/               # "즐겨찾기" 화면
│   ├── guide/                     # "이용안내" 화면 (이용 방법, 혼잡도 안내, FAQ)
│   ├── profile/                     # "내 정보" 화면
│   ├── navigation/                    # 상단 내비게이션(TopNavBar) - 데스크톱 가로 탭 / 모바일 햄버거
│   ├── permission/                     # 위치 권한 안내 배너
│   └── common/                          # Button, Skeleton, Toast, Logo, 아이콘, 목록 아이템 등 공용 UI
├── hooks/                     # useGeolocation, useKakaoLoader, useParkingLots, useParkingFilters,
│                              # useBottomSheet, useFavorites, useDebounce, useMediaQuery 등
├── lib/
│   ├── kakao/                 # Kakao SDK 로더, 마커/경로선 DOM 팩토리
│   ├── regions/                # 지역별 실시간 데이터 어댑터 (크론이 순회, 지역 추가 시 여기에 등록)
│   ├── parking/                 # 혼잡도 계산, 주차 유형, 데이터 접근 계층(Repository)
│   └── supabase/                 # Supabase 클라이언트 + 즐겨찾기/길찾기 로그 CRUD
├── types/                      # ParkingLot 등 도메인 타입, Kakao SDK 타입 선언
├── utils/                       # 거리/ETA 계산, 포맷터, 요금 파싱, 시간대별 추이·소셜 카운트 샘플 생성 등
├── data/
│   └── parking_lots.json       # 주차장 데이터 단일 소스 (요구사항 10)
├── database/
│   ├── schema.sql               # Supabase 테이블 정의 (SQL, 외래키 포함)
│   └── seed.sql                  # parking_lots.json 기반 초기 데이터 적재 스크립트
└── docs/                         # 요구사항 / 디자인 가이드 / 연동 정보 문서
```

## 5. 주요 기능

- **상단 내비게이션 + 실제 라우팅**: 홈 / 주차장 찾기 / 즐겨찾기 / 이용안내 / 내 정보 5개 페이지로 실제 URL이 분리되어 있습니다. 데스크톱은 가로 탭, 모바일은 햄버거 메뉴로 표시됩니다.
- **현재 위치 기반 지도**: Geolocation API로 현재 위치를 가져와 지도 중심을 이동하고, 파란색 펄스 마커로 표시합니다.
- **혼잡도 마커**: 여유(🟢)/보통(🟡)/혼잡(🔴)/만차(⚫) 4단계로 색상이 구분된 핀 마커 아래 "가능 면수 + 상태" 라벨을 함께 표시하며, 클릭 시 확대 + Bounce 애니메이션이 적용됩니다.
- **검색 & 자동완성 (주차장 + 실제 장소)**: 주차장명/주소 검색에 더해, 카카오 Places 키워드 검색으로 실제 지명·주소도 검색할 수 있습니다. 장소를 선택하면 해당 좌표로 지도가 이동합니다.
- **필터 바**: 실시간 주차 가능(혼잡도)/요금/운영시간/주차 유형(노외·노상)을 칩 드롭다운 또는 통합 필터 패널로 조합해 지도·검색 결과를 동시에 좁힐 수 있습니다.
- **지도 범위 재검색**: 주차장 찾기 화면 우측 상단에 항상 떠 있는 "지도 범위" 버튼으로 현재 화면 범위 안의 주차장 개수를 바로 확인할 수 있습니다 (같은 자리의 "실시간 주차장만 보기" 토글은 참고 디자인 재현용으로, 걸러낼 데이터가 없어 실제 필터링은 하지 않습니다).
- **경로선 + 도착 예상 시간**: 주차장을 선택하면 현재 위치까지 직선 경로와 "도착까지 N분 · 거리" 카드를 지도 위에 표시합니다 (실제 도로 경로 API 대신 직선거리 기반 근사치).
- **Bottom Sheet / Desktop 패널**: 주차장명, 주소, 실시간 업데이트(새로고침), 현재 가능 면수, **24시간 혼잡도 추이 그래프**, 운영시간·요금·총면수·**길찾기 중인 사람 수**, 길찾기/즐겨찾기 버튼을 보여줍니다. 모바일에서는 드래그로 collapsed(42%)/expanded(88%) 상태를 전환할 수 있고("상세 정보 보기" 버튼으로도 확장 가능), 데스크톱에서는 지도와 동시에 볼 수 있는 고정 패널로 표시됩니다.
- **주차장 찾기 페이지**: 진입 시 내 실시간 위치로 지도가 이동하고, 검색 결과 목록은 필터의 "거리" 칩에서 고른 반경(1km/3km/5km, 기본 3km) 이내 주차장으로 제한됩니다. 데스크톱은 검색창·필터·목록(추천순/거리순 정렬 — 추천순은 거리와 혼잡도를 함께 계산)을 왼쪽 사이드바에 항상 표시하고, 모바일은 지도 화면 위에 검색창/필터가 뜨며 "목록 보기" 버튼으로 전체 목록 화면을 오갈 수 있습니다 (구 "내 주변" 탭 기능 통합).
- **길찾기 / 즐겨찾기 (Supabase 연동)**: 길찾기 버튼은 카카오맵 길찾기 페이지를 새 탭으로 열면서 `navigation_events` 테이블에 클릭 로그를 남기고, 즐겨찾기 버튼은 `favorites` 테이블에 추가/삭제합니다. 즐겨찾기 상태는 화면 간 하나의 훅(`useFavorites`)을 공유해 항상 일치합니다. (낙관적 업데이트 + 실패 시 롤백/에러 토스트)
- **즐겨찾기 페이지**: 주차장 찾기와 동일한 지도·상세 카드 구성에 즐겨찾기 전용 정렬 탭(전체/최근 이용순/내가 추가한 순 — 각각 즐겨찾기 추가 시각·실제 조회 시각 기준 실 데이터로 정렬)과 혼잡도 필터, "편집" 모드(별 아이콘 대신 삭제 아이콘)를 제공합니다.
- **Loading / Error / Empty 처리**: 지도·검색창 Skeleton UI, 위치 권한 거부/지도 로드 실패/검색·필터 결과 없음/주차장 없음 등 예외 상황에 대한 전용 UI를 제공합니다.
- **반응형 레이아웃**: Mobile → Tablet → Desktop 순으로 자연스럽게 확장되며, `md` 이상에서는 지도와 상세 패널을 동시에 볼 수 있습니다.

> **참고**: 24시간 혼잡도 추이 그래프와 "길찾기 중인 사람 수"는 실시간 이력·사용자 추적 데이터가 없는 MVP 단계라 `utils/congestionTrend.ts`, `utils/socialSignal.ts` 에서 주차장 id 기반 **결정적 샘플 데이터**로 생성합니다 (새로고침해도 값이 바뀌지 않음). 실제 서비스 전환 시 이 두 함수만 실데이터 조회로 교체하면 됩니다.

## 6. 데이터 구조

`data/parking_lots.json` 하나만 애플리케이션의 데이터 소스로 사용합니다 (하드코딩 금지).

이 파일은 세 지자체의 실시간 주차장 API에서 받아온 데이터를 합친 것입니다.

- **서울특별시**(`openapi.seoul.go.kr` `GetParkingInfo`+`GetParkInfo`): 서울은 실시간 API(`GetParkingInfo`, 123곳, "시" 관리)와 위치정보 API(`GetParkInfo`, 2,204곳, 대부분 "구" 관리)가 분리되어 있지만 둘 다 `PKLT_CD` 식별자를 공유합니다. 겹치는 118곳 중 좌표가 깔끔한 노외(NW) 주차장이면서 실제로 실시간 연계 중인(`PRK_STTS_YN=1`) **50곳**만 선별했습니다 (나머지는 노상 주차장이라 하나의 코드에 좌표가 수십 개씩 중복되어 지도 마커 하나로 표현하기 부적절하거나, "미연계중" 상태라 제외).
- **대전광역시**(`apis.data.go.kr/6300000/pis/parkinglotIF`): 대전 전체 756개 주차장 중, 실시간 잔여면수(`resQty`)가 실제 의미 있는 값으로 제공되는 **13곳**만 선별했습니다. 나머지는 (1) 기본 정보만 있고 실시간 값이 없거나(`"NONE"`, 740곳) (2) 실시간 필드는 있지만 총면수·잔여면수가 둘 다 0으로 내려와 신뢰할 수 없는 경우(3곳)라 제외했습니다. 요금 정보 있음. 공영/민영 구분 필드가 없어 "NJ타워 주차장"은 이름상 민간 건물 부설 주차장으로 보입니다.
- **강원특별자치도 강릉시**(`apis.data.go.kr/4201000/GNitsTrafficInfoService_1.0`): 강릉시 전체 **13곳 모두 실시간** 제공됩니다 (`getParkInfo`+`getParkRltm`, 공통 식별자 `prkId`로 매칭). 전부 `prkType: 공영`. 다만 이 API는 요금 정보 필드 자체가 없어 `fee` 값이 "요금 정보 없음"으로 표시됩니다.
- **전국공항**(`apis.data.go.kr/B551178/parking-congestion`, 한국공항공사): 전국 14개 공항 25개 주차장 전체가 실시간 제공됩니다. 다만 이 API는 **좌표 필드가 없어**, 각 공항의 대표 좌표를 조사해 넣었습니다(같은 공항 내 여러 주차장은 시각적 구분을 위해 좌표를 살짝 오프셋 처리 — 실제 건물별 정확한 위치가 아닙니다). 요금 정보도 없어 "요금 정보 없음"으로 표시됩니다.
- **경상남도 진주시**(`apis.data.go.kr/5310000/jinjuparking`): 진주시 전체 24곳 중 7곳이 국토교통부 표준데이터(`prkplceNo`)와 동일한 ID 체계를 써서 대조했더니 **5곳만** 실제로 좌표가 확인됐습니다(나머지는 진주시 자체 번호라 좌표를 알 수 없음). 5곳 모두 소규모 노상 주차장(9~19면)입니다.

이름/주소/좌표/총면수/운영시간과 **실시간 가능면수 모두 실제 API 응답값**입니다(샘플/랜덤 데이터 없음).

```ts
interface ParkingLot {
  id: string;
  name: string;
  district: string; // 자치구/시명 (예: "서구", "강릉시") — 다른 시/도 확장을 고려해 고정 목록 대신 문자열
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
- **초기 데이터 적재**: `database/seed.sql` 이 `data/parking_lots.json` 의 106개 주차장(서울 50 + 전국공항 25 + 대전 13 + 강릉 13 + 진주 5)을 `parking_lots`/`parking_status` 에 upsert 합니다 (즐겨찾기·길찾기 로그의 외래키 무결성을 위해 선행되어야 합니다).
- **실시간 조회**: `lib/supabase/parkingLots.ts`(`fetchParkingLotsFromSupabase`)가 `parking_lots` + `parking_status` 를 조인해 `ParkingLot[]` 를 반환하며, `lib/parking/parkingRepository.ts` 가 이 함수를 호출합니다. 즉 지도 렌더링은 정적 JSON이 아니라 **Supabase에서 실시간으로 조회**합니다.

### 실시간 자동 갱신 (크론)

- `app/api/cron/refresh-parking-status/route.ts` 가 `lib/regions/` 에 등록된 지역 어댑터(현재 서울·대전·강릉·전국공항·진주 5곳)를 순회해 각 지역 API를 호출하고, 결과를 `parking_status` 테이블에 upsert 합니다.
- `vercel.json` 의 `crons` 설정으로 Vercel이 이 엔드포인트를 주기 호출합니다 (하루 1번, `0 0 * * *`). **Vercel 무료(Hobby) 플랜은 하루 1회보다 잦은 크론 스케줄을 아예 허용하지 않습니다** — 배포 단계에서 검증에 걸려 **배포 자체가 실패**합니다(단순히 "덜 자주 도는" 게 아니라 빌드가 깨집니다). 더 자주 갱신하려면 Pro 플랜으로 업그레이드한 뒤 스케줄을 촘촘하게(예: `*/10 * * * *`) 바꿔야 합니다.
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

- **다른 지역 실시간 API 연동**: 국가 통합 API(한국교통안전공단 `B553881`)는 위치정보 API와 실시간 API의 식별번호 체계가 서로 달라 직접 매칭이 안 되고, 현재는 서비스 자체도 502 오류로 응답하지 않습니다. 대신 **지자체별로 개별 제공하는 API**는 위치정보와 실시간 잔여면수가 하나의 응답에 함께 들어있거나(대전 `6300000/pis`), 별도 API라도 공통 식별자로 깔끔하게 매칭됩니다(강릉 `prkId`, 서울 `PKLT_CD`). 다만 서울처럼 두 API의 대상 범위 자체가 다르면(실시간 123곳 vs 위치정보 2,204곳) 겹치는 부분만 쓸 수 있다는 점, 그리고 노상 주차장은 하나의 코드에 좌표가 여러 개 중복될 수 있다는 점을 확인해야 합니다. 다른 시/도도 data.go.kr · 열린데이터광장에서 지자체명으로 검색해 유사한 API를 찾아 `lib/regions/`에 어댑터로 추가하는 방식으로 확장합니다.
- **지역별 실시간 비율 편차 고려**: 대전은 전체 756곳 중 13곳(약 1.7%), 서울은 위치정보 2,204곳 중 50곳(약 2.3%), 진주는 24곳 중 5곳(약 21%)만 의미 있는 실시간 값이 제공되어, 이번 버전은 그만큼만 반영했습니다. 강릉·전국공항은 해당 API가 다루는 전체가 실시간이라 100% 반영했습니다. 지역을 추가할 때마다 전체 중 실시간 제공 비율을 먼저 확인하고, 기본 정보만 있는(또는 값이 비어있는) 나머지를 포함할지 여부를 판단해야 합니다.
- **좌표 없는 API 대응**: 부산시설공단(47곳)처럼 실시간 데이터는 있지만 좌표·주소가 전혀 없는 API도 있습니다. 국토부 표준데이터와 식별번호가 겹치면(진주 사례) 대조해서 좌표를 얻을 수 있지만, 이름만으로는 정확한 매칭이 어려워 이번 버전에서는 제외했습니다. 전국공항처럼 위치 후보가 적고(공항 14곳) 잘 알려진 경우는 좌표를 직접 조사해 근사값으로 채우는 방법도 있습니다.
- **다중 지역 확장 시 성능**: 앱은 Supabase에서 `parking_lots`/`parking_status` 를 조회해 렌더링하므로, 지역을 몇 개를 추가하든 프런트엔드 구조 자체는 그대로입니다. 다만 전국 약 18,530곳처럼 규모가 커지면 모든 마커를 한 번에 DOM으로 렌더링하기 어려우므로, 이미 구현된 `lib/kakao/clustering.ts` 격자 클러스터링(줌 레벨에 따라 숫자 묶음 ↔ 개별 마커 전환, "이 지역 검색" 클릭 시에만 갱신)을 계속 활용합니다.
- **서비스 역할 키로 전환**: 지금은 MVP 단계라 크론이 Publishable Key + 열린 RLS로 `parking_status` 에 씁니다. 정식 서비스 전환 시에는 Supabase 서비스 역할 키를 Vercel 환경변수로 관리하고 크론 라우트에서만 사용하도록 바꾼 뒤, `parking_status_public_insert`/`_update` anon 정책은 제거하는 것을 권장합니다.
- **회원 시스템 & 개인화된 즐겨찾기**: 현재 `favorites` 는 로그인 없이 전체 방문자가 공유하는 목록입니다. 인증 도입 시 `favorites` 에 `user_id` 컬럼을 추가하고 unique 제약을 `(user_id, parking_lot_id)` 로 변경하면 사용자별 즐겨찾기로 승격할 수 있습니다.
- **인기 주차장 분석**: `navigation_events` 로그를 집계하여 인기 주차장 추천, 혼잡 예측 등 부가 기능으로 확장할 수 있습니다.
- **서버 사이드 쓰기 강화**: 현재 `parking_lots`/`parking_status` 는 SQL Editor(또는 서비스 역할 키)로만 쓸 수 있도록 RLS가 설계되어 있습니다. 실시간 수집 파이프라인을 붙일 때는 Supabase Edge Function이나 서버리스 크론에서 서비스 역할 키로 갱신하는 구조를 권장합니다.
