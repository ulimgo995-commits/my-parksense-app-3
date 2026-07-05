# 🎨 [Design Guide] ParkSense

## 1. 디자인 목표

ParkSense는 운전자가 빠르고 직관적으로 주변 주차장 상태를 확인할 수 있도록 설계된 지도 중심 서비스입니다.

UI는 Google Maps, 카카오맵, 네이버지도의 장점을 참고하여 현대적이고 직관적인 디자인을 제공합니다.

전체적인 디자인 방향은 심플하면서도 실제 서비스 수준의 완성도를 목표로 합니다.

---

# 2. 디자인 컨셉

키워드

- Modern
- Clean
- Simple
- Fast
- Mobile First

사용자가 지도를 보는 시간을 최소화하고 필요한 정보를 빠르게 얻을 수 있도록 설계합니다.

---

# 3. 컬러 시스템

## Primary

Blue

HEX

#2563EB

용도

- 메인 버튼
- 현재 위치 버튼
- 선택된 Marker
- 강조 요소

---

## Success

Green

HEX

#22C55E

용도

혼잡도

여유

---

## Warning

Yellow

HEX

#FACC15

용도

혼잡도

보통

---

## Danger

Red

HEX

#EF4444

용도

혼잡

---

## Full

Dark Gray

HEX

#374151

용도

만차

---

## Background

White

#FFFFFF

---

## Text

Primary

#111827

Secondary

#6B7280

Divider

#E5E7EB

---

# 4. Typography

Font

Pretendard

Fallback

Noto Sans KR

Heading

Bold

Body

Medium

Caption

Regular

---

# 5. 메인 화면(Home)

첫 화면은 지도가 대부분을 차지합니다.

구성

상단

검색창

↓

전체 화면 지도

↓

우측 하단

현재 위치 버튼

↓

하단

Bottom Sheet

---

# 6. 지도(Map)

카카오맵 SDK를 사용합니다.

현재 위치를 파란색 Marker로 표시합니다.

서울 공영주차장 약 20~30개를 Marker로 표시합니다.

Marker는 혼잡도에 따라 색상이 변경됩니다.

🟢 여유

🟡 보통

🔴 혼잡

⚫ 만차

Marker 클릭 시

- 확대 애니메이션
- Bounce 효과
- Bottom Sheet 표시

---

# 7. 검색(Search)

상단 고정

Rounded 검색창

Placeholder

"주차장 이름을 검색하세요"

자동완성 지원

검색 시

해당 Marker로 이동

---

# 8. Bottom Sheet

모바일 앱 스타일

Rounded 24px

Shadow

Blur Background

드래그 가능

높이

Collapsed

40%

Expanded

80%

표시 정보

- 주차장명
- 주소
- 운영시간
- 요금
- 총 주차면수
- 현재 가능면수
- 혼잡도
- 마지막 업데이트 시간

하단

Primary Button

길찾기

---

# 9. 버튼

Primary

Blue

Rounded-xl

Height

48px

Hover

Scale

Transition

200ms

---

Secondary

White

Border

Gray

Rounded-xl

---

# 10. Floating Button

현재 위치 버튼

우측 하단

원형

Shadow

Hover Animation

클릭 시

현재 위치로 이동

---

# 11. 혼잡도 UI

여유

🟢 Green

보통

🟡 Yellow

혼잡

🔴 Red

만차

⚫ Gray

지도

Bottom Sheet

검색 결과

모든 화면에서 동일한 색상을 사용합니다.

---

# 12. 반응형

기본

Mobile First

지원

- Mobile
- Tablet
- Desktop

Desktop에서는

지도와 Bottom Sheet가 동시에 보이도록 구성합니다.

---

# 13. 애니메이션

Marker

Scale Animation

Bottom Sheet

Slide Up

검색

Fade

Loading

Skeleton UI

Hover

Transition

200~300ms

---

# 14. 예외 처리

위치 권한 거부

안내 메시지 표시

주차장이 없는 경우

Empty State

네트워크 오류

Error UI

Loading

Skeleton UI

---

# 15. 개발 요청사항

Claude는 단순한 예제 수준이 아닌 실제 서비스 수준의 UI를 구현합니다.

Google Maps, 카카오맵, 네이버지도의 UX를 참고하여 자연스럽고 직관적인 인터페이스를 제공합니다.

Tailwind CSS를 적극 활용하여 유지보수가 쉬운 컴포넌트 구조로 구현합니다.

애니메이션은 과하지 않게 부드럽게 적용합니다.

모바일에서 사용성이 가장 좋도록 설계합니다.