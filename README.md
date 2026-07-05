# 🅿️ ParkSense

목적지 기반 주차장 혼잡도 안내 서비스 — 서울 공영주차장의 혼잡도를 지도에서 색상으로 바로 확인하고, 가장 적합한 주차장을 빠르게 찾을 수 있도록 도와주는 지도 기반 웹 서비스입니다.

## 1. 프로젝트 소개

현재 대부분의 지도 서비스는 주차장의 위치는 제공하지만, 지금 얼마나 여유가 있는지는 직관적으로 확인하기 어렵습니다. ParkSense는 지도 위 마커 색상만으로 혼잡도(여유/보통/혼잡/만차)를 즉시 파악할 수 있게 하여, 운전자가 주차장을 찾아 헤매는 시간을 줄여줍니다.

이번 버전은 서울 4개 자치구(강남구, 종로구, 중구, 성동구)의 공영주차장 약 26개를 대상으로 하는 MVP이며, 향후 실시간 공공데이터 API 및 전국 단위 확장을 고려하여 설계되었습니다.

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
3. `database/seed.sql` 내용을 붙여넣고 실행 (`data/parking_lots.json` 의 26개 주차장을 `parking_lots`/`parking_status` 테이블에 적재)

두 스크립트 모두 `on conflict ... do update` 로 작성되어 있어 여러 번 실행해도 안전합니다.

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
│   ├── home/                 # Home 화면 조립 (상태 관리)
│   ├── map/                  # 카카오맵, 현재 위치 버튼, 범례, 로딩/에러 UI
│   ├── search/                # 검색창 + 자동완성
│   ├── bottom-sheet/          # Bottom Sheet / Desktop 패널, 상세 정보
│   ├── permission/            # 위치 권한 안내 배너
│   └── common/                 # Button, Skeleton, Toast, 아이콘 등 공용 UI
├── hooks/                     # useGeolocation, useKakaoLoader, useParkingLots,
│                              # useBottomSheet, useFavorites, useDebounce 등
├── lib/
│   ├── kakao/                 # Kakao SDK 로더, 마커 DOM 팩토리
│   ├── parking/                # 혼잡도 계산, 데이터 접근 계층(Repository)
│   └── supabase/               # Supabase 클라이언트 + 즐겨찾기/길찾기 로그 CRUD
├── types/                      # ParkingLot 등 도메인 타입, Kakao SDK 타입 선언
├── utils/                       # 거리 계산, 포맷터, 카카오 길찾기 URL 등
├── data/
│   └── parking_lots.json       # 주차장 데이터 단일 소스 (요구사항 10)
├── database/
│   ├── schema.sql               # Supabase 테이블 정의 (SQL, 외래키 포함)
│   └── seed.sql                  # parking_lots.json 기반 초기 데이터 적재 스크립트
└── docs/                         # 요구사항 / 디자인 가이드 / 연동 정보 문서
```

## 5. 주요 기능

- **현재 위치 기반 지도**: Geolocation API로 현재 위치를 가져와 지도 중심을 이동하고, 파란색 펄스 마커로 표시합니다.
- **혼잡도 마커**: 여유(🟢)/보통(🟡)/혼잡(🔴)/만차(⚫) 4단계로 색상이 구분된 마커를 지도에 표시하며, 클릭 시 확대 + Bounce 애니메이션이 적용됩니다.
- **Bottom Sheet / Desktop 패널**: 마커 클릭 시 주차장명, 주소, 운영시간, 요금, 총/가능 면수, 혼잡도, 마지막 업데이트 시간을 보여줍니다. 모바일에서는 드래그로 collapsed(42%)/expanded(88%) 상태를 전환할 수 있고, 데스크톱에서는 지도와 동시에 볼 수 있는 고정 패널로 표시됩니다.
- **검색 & 자동완성**: 주차장명/주소로 검색하면 실시간 자동완성 결과가 나타나고, 선택 시 해당 마커로 지도가 이동합니다.
- **길찾기 / 즐겨찾기 (Supabase 연동)**: 길찾기 버튼은 카카오맵 길찾기 페이지를 새 탭으로 열면서 `navigation_events` 테이블에 클릭 로그를 남기고, 즐겨찾기 버튼은 `favorites` 테이블에 추가/삭제하며 Bottom Sheet를 다시 열 때마다 최신 목록을 조회합니다. (낙관적 업데이트 + 실패 시 롤백/에러 토스트)
- **Loading / Error / Empty 처리**: 지도·검색창 Skeleton UI, 위치 권한 거부/지도 로드 실패/검색 결과 없음/주차장 없음 등 예외 상황에 대한 전용 UI를 제공합니다.
- **반응형 레이아웃**: Mobile → Tablet → Desktop 순으로 자연스럽게 확장되며, `md` 이상에서는 지도와 상세 패널을 동시에 볼 수 있습니다.

## 6. 데이터 구조

`data/parking_lots.json` 하나만 애플리케이션의 데이터 소스로 사용합니다 (하드코딩 금지).

```ts
interface ParkingLot {
  id: string;
  name: string;
  district: '강남구' | '종로구' | '중구' | '성동구';
  address: string;
  lat: number;
  lng: number;
  operationHours: string;
  fee: string;
  totalSpaces: number;
  availableSpaces: number;
  updatedAt: string; // ISO 8601
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
| `parking_lots` | 주차장 기본 정보 | `id` 는 `data/parking_lots.json` 의 slug(text)를 그대로 기본키로 사용 |
| `parking_status` | 현재 혼잡도/가능면수 | `parking_lot_id` UNIQUE — 주차장당 "현재 상태" 1행만 유지, 향후 upsert로 갱신 |
| `favorites` | 즐겨찾기 | `parking_lot_id` UNIQUE — 중복 즐겨찾기 방지 |
| `navigation_events` | 길찾기 클릭 로그 | 집계/분석용 |

4개 테이블 모두 `parking_lots(id)` 를 참조하는 외래키(`on delete cascade`)가 걸려 있어, 주차장이 삭제되면 관련 상태/즐겨찾기/로그도 함께 정리됩니다.

### 실제 연동된 기능

- **즐겨찾기 CRUD**: `lib/supabase/favorites.ts`(`listFavorites`/`addFavorite`/`removeFavorite`) ↔ `hooks/useFavorites.ts` — Bottom Sheet의 즐겨찾기 버튼과 실시간으로 연결되어 있으며, 낙관적 업데이트 후 실패 시 자동 롤백 + 에러 토스트를 표시합니다.
- **길찾기 로그**: `lib/supabase/navigationEvents.ts`(`logNavigationEvent`) — Bottom Sheet의 길찾기 버튼 클릭 시 카카오맵 새 탭을 먼저 열고(팝업 차단 방지), 이어서 비동기로 `navigation_events` 에 기록합니다. 실패해도 사용자 흐름을 막지 않습니다.
- **초기 데이터 적재**: `database/seed.sql` 이 `data/parking_lots.json` 의 26개 주차장을 `parking_lots`/`parking_status` 에 upsert 합니다 (즐겨찾기·길찾기 로그의 외래키 무결성을 위해 선행되어야 합니다).
- **향후 실시간 조회 대비**: `lib/supabase/parkingLots.ts`(`fetchParkingLotsFromSupabase`)가 `parking_lots` + `parking_status` 를 조인해 앱이 쓰는 것과 동일한 `ParkingLot[]` 타입을 반환하도록 미리 구현되어 있습니다. 지도 렌더링은 여전히 requirements.md 10 규칙에 따라 `data/parking_lots.json` 만 사용하지만(`lib/parking/parkingRepository.ts`), 실시간 전환 시 이 함수로 구현부만 바꾸면 됩니다.

## 8. 향후 확장 계획

- **실시간 공공데이터 연동**: 공공데이터포털/서울 열린데이터광장 API 응답을 `parking_status` 테이블에 주기적으로 upsert 하고, `lib/parking/parkingRepository.ts` 의 `fetchParkingLots` 구현부를 `lib/supabase/parkingLots.ts` 의 `fetchParkingLotsFromSupabase` 호출로 교체하면 나머지 UI/훅/컴포넌트 변경 없이 실시간 서비스로 전환 가능합니다.
- **전국 단위 확장**: 현재 4개 자치구 → 서울 전체 → 전국 공영주차장으로 데이터 범위만 확장하면 되도록 타입과 지도 렌더링 로직이 구/지역에 종속되지 않게 설계했습니다.
- **회원 시스템 & 개인화된 즐겨찾기**: 현재 `favorites` 는 로그인 없이 전체 방문자가 공유하는 목록입니다. 인증 도입 시 `favorites` 에 `user_id` 컬럼을 추가하고 unique 제약을 `(user_id, parking_lot_id)` 로 변경하면 사용자별 즐겨찾기로 승격할 수 있습니다.
- **인기 주차장 분석**: `navigation_events` 로그를 집계하여 인기 주차장 추천, 혼잡 예측 등 부가 기능으로 확장할 수 있습니다.
- **서버 사이드 쓰기 강화**: 현재 `parking_lots`/`parking_status` 는 SQL Editor(또는 서비스 역할 키)로만 쓸 수 있도록 RLS가 설계되어 있습니다. 실시간 수집 파이프라인을 붙일 때는 Supabase Edge Function이나 서버리스 크론에서 서비스 역할 키로 갱신하는 구조를 권장합니다.
