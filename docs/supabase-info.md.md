# ⚡ [Supabase Information] ParkSense

## 1. 프로젝트 정보

Claude는 아래 정보를 사용하여 Supabase를 연동합니다.

### Project ID

SUPABASE_PROJECT_ID=ucuqphqplzjywegngmsm

### Publishable Key

SUPABASE_PUBLISHABLE_KEY=sb_publishable_AY9i6W1RYFVyt4PfTGFMXA_cN0oliNj

---

## 2. 프로젝트 목적

이번 프로젝트는 메이커톤 MVP입니다.

현재는 샘플 데이터를 사용하여 서비스를 구현하지만, 추후 실시간 공공데이터 API를 연결할 수 있도록 확장 가능한 구조로 설계합니다.

Claude는 확장성을 고려하여 데이터베이스를 설계합니다.

---

# 3. Database Tables

이번 프로젝트에서는 아래 테이블을 사용합니다.

1. parking_lots
2. parking_status
3. favorites
4. navigation_events

Claude는 위 테이블을 기준으로 SQL(schema.sql)을 생성합니다.

---

# 4. parking_lots

주차장 기본 정보

컬럼

id

UUID

Primary Key

---

name

TEXT

주차장명

---

district

TEXT

구

예)

강남구

종로구

중구

성동구

---

address

TEXT

주차장 주소

---

latitude

DOUBLE PRECISION

위도

---

longitude

DOUBLE PRECISION

경도

---

operation_hours

TEXT

운영시간

예)

24시간

09:00~22:00

---

fee

TEXT

요금

예)

10분당 500원

---

created_at

TIMESTAMP

기본값

NOW()

---

# 5. parking_status

현재 주차장 상태

id

UUID

Primary Key

---

parking_lot_id

UUID

parking_lots.id 참조

Foreign Key

---

total_spaces

INTEGER

총 주차면수

---

available_spaces

INTEGER

현재 가능면수

---

status

TEXT

값

여유

보통

혼잡

만차

---

updated_at

TIMESTAMP

마지막 업데이트

---

# 6. favorites

즐겨찾기

id

UUID

Primary Key

---

parking_lot_id

UUID

parking_lots.id 참조

---

created_at

TIMESTAMP

기본값

NOW()

---

# 7. navigation_events

길찾기 버튼 클릭 기록

id

UUID

Primary Key

---

parking_lot_id

UUID

parking_lots.id 참조

---

clicked_at

TIMESTAMP

기본값

NOW()

---

# 8. 데이터 저장 규칙

parking_lots

실제 서울 공영주차장 약 20~30개

사용

parking_status

샘플 데이터

사용

favorites

사용자 즐겨찾기

navigation_events

길찾기 클릭 로그

---

# 9. Claude 구현 요청사항

Claude는

.env.local 파일을 생성하지 않습니다.

docs 폴더에 작성된 Supabase 정보를 사용하여 직접 연동합니다.

schema.sql 파일을

/database/schema.sql

위치에 생성합니다.

Supabase JavaScript Client를 사용합니다.

CRUD 구조를 쉽게 확장할 수 있도록 구현합니다.

---

# 10. 향후 확장

현재는 샘플 데이터를 사용합니다.

향후에는

공공데이터포털

서울 열린데이터광장

지자체 실시간 주차 API

등을 연결하여

parking_status 테이블만 실시간으로 업데이트하면 서비스가 동작할 수 있도록 설계합니다.