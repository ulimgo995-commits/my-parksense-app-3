import Link from 'next/link';
import { LogoMark } from '@/components/common/Logo';
import {
  CarIcon,
  CheckIcon,
  ClockIcon,
  GridIcon,
  ParkingPinIcon,
  PinIcon,
  RefreshIcon,
  StarIcon,
} from '@/components/common/icons';
import { CONGESTION_LEVELS, getCongestionMetaByLevel } from '@/lib/parking/congestion';
import { FaqAccordion } from './FaqAccordion';

const STEPS = [
  { icon: <PinIcon size={22} />, title: '지역 검색', description: '가고 싶은 지역이나 장소를 검색하세요.' },
  { icon: <ParkingPinIcon size={22} />, title: '주차장 선택', description: '지도나 목록에서 원하는 주차장을 선택하세요.' },
  { icon: <RefreshIcon size={22} />, title: '실시간 현황 확인', description: '실시간 가능 면수와 혼잡도를 확인하세요.' },
  { icon: <StarIcon size={22} />, title: '즐겨찾기 · 길찾기', description: '자주 가는 곳은 즐겨찾기하고, 길찾기로 바로 이동하세요.' },
  { icon: <CarIcon size={22} />, title: '주차 이용', description: '안내받은 주차장에 편하게 주차하세요.' },
];

const CONGESTION_RANGE_TEXT: Record<string, string> = {
  available: '가능면수 비율 60% 이상',
  moderate: '가능면수 비율 30~59%',
  congested: '가능면수 비율 1~29%',
  full: '가능면수 0면',
};

const ENVIRONMENT_ITEMS = [
  { icon: <GridIcon size={20} />, title: 'PC / 모바일 반응형', description: '화면 크기에 맞춰 자동으로 최적화됩니다.' },
  { icon: <PinIcon size={20} />, title: '위치 기반 서비스', description: '현재 위치를 기준으로 가까운 주차장을 안내합니다.' },
  { icon: <RefreshIcon size={20} />, title: '실시간 갱신', description: '지역별 공공데이터 API를 주기적으로 갱신합니다.' },
  { icon: <CheckIcon size={20} />, title: '로그인 없이 이용', description: '회원가입 없이 누구나 즐겨찾기·길찾기를 사용할 수 있어요.' },
];

const FAQ_ITEMS = [
  {
    question: '실시간 정보는 얼마나 자주 갱신되나요?',
    answer:
      '지역별 공공데이터 API를 통해 주기적으로 자동 갱신됩니다. 갱신 주기는 서비스 운영 환경에 따라 하루 1회~수 분 간격까지 다를 수 있어요.',
  },
  {
    question: '왜 일부 지역만 실시간 정보가 있나요?',
    answer:
      'ParkFlow는 각 지자체·기관이 공개한 실시간 주차 데이터를 사용합니다. 위치 정보와 실시간 잔여면수를 함께 제공하는 지역부터 순차적으로 반영하고 있어, 아직 모든 지역을 지원하지는 않아요.',
  },
  {
    question: '즐겨찾기는 어떻게 저장되나요?',
    answer: '로그인 없이도 즐겨찾기를 추가/삭제할 수 있습니다. 계정 시스템이 도입되면 사용자별 즐겨찾기로 확장될 예정이에요.',
  },
  {
    question: '혼잡도는 어떤 기준으로 계산되나요?',
    answer: '표시된 총 주차면수 대비 현재 가능면수의 비율로 계산하며, 아래 혼잡도 색상 안내를 참고해주세요.',
  },
];

/** "이용안내" 페이지: 서비스 소개, 이용 방법, 혼잡도 색상 안내, FAQ */
export function GuideScreen() {
  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-primary-light px-6 py-10 text-center">
          <LogoMark size={48} />
          <h1 className="text-xl font-extrabold text-text-primary md:text-2xl">ParkFlow 이용 안내</h1>
          <p className="max-w-md text-sm text-text-secondary">
            ParkFlow는 실시간 주차 가능 정보를 지도에서 바로 확인할 수 있도록 도와주는 목적지 기반 주차장 안내
            서비스입니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-text-primary">서비스 이용 방법</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 p-4 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-card">
                  {step.icon}
                </span>
                <p className="text-xs font-semibold text-text-secondary">STEP {index + 1}</p>
                <p className="text-sm font-bold text-text-primary">{step.title}</p>
                <p className="text-xs text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-text-primary">혼잡도 색상 안내</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {CONGESTION_LEVELS.map((level) => {
              const meta = getCongestionMetaByLevel(level);
              return (
                <div key={level} className="rounded-2xl border border-divider p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="text-sm font-bold" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">{CONGESTION_RANGE_TEXT[level]}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-text-primary">서비스 이용 환경</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {ENVIRONMENT_ITEMS.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-card">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">{item.title}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-text-primary">자주 묻는 질문</h2>
          <div className="mt-4">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </section>

        <section className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-divider p-6 text-center">
          <ClockIcon size={22} className="text-primary" />
          <p className="text-sm font-bold text-text-primary">더 궁금한 점이 있으신가요?</p>
          <p className="text-xs text-text-secondary">버그 제보나 문의사항은 GitHub 저장소 Issues로 남겨주세요.</p>
          <Link
            href="https://github.com/ulimgo995-commits/parksense/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            GitHub Issues 열기
          </Link>
        </section>
      </div>
    </div>
  );
}
