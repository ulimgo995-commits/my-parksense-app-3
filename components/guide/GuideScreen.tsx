import Link from 'next/link';
import { LogoMark } from '@/components/common/Logo';
import {
  BellIcon,
  CarIcon,
  GridIcon,
  InfoIcon,
  MonitorIcon,
  ParkingPinIcon,
  PinIcon,
  RefreshIcon,
  ShieldIcon,
  StarIcon,
  WifiIcon,
} from '@/components/common/icons';
import { CONGESTION_LEVELS, getCongestionMetaByLevel } from '@/lib/parking/congestion';
import { FaqAccordion } from './FaqAccordion';
import { GuideHeroIllustration } from './GuideHeroIllustration';

const STEPS = [
  { icon: <PinIcon size={22} />, title: '지역 검색', description: '가고 싶은 지역이나 장소를 검색하세요.' },
  { icon: <ParkingPinIcon size={22} />, title: '주차장 선택', description: '지도나 목록에서 원하는 주차장을 선택하세요.' },
  { icon: <RefreshIcon size={22} />, title: '실시간 현황 확인', description: '실시간 가능 면수와 혼잡도를 확인하세요.' },
  { icon: <StarIcon size={22} />, title: '즐겨찾기 · 길찾기', description: '자주 가는 곳은 즐겨찾기하고, 길찾기로 바로 이동하세요.' },
  { icon: <CarIcon size={22} />, title: '주차 이용', description: '안내받은 주차장에 편하게 주차하세요.' },
];

const CONGESTION_RANGE_TEXT: Record<string, string> = {
  available: '50% ~ 100%',
  moderate: '20% ~ 49%',
  congested: '1% ~ 19%',
  full: '0대(만차)',
};

const CONGESTION_SUBTEXT: Record<string, string> = {
  available: '널널한 상태',
  moderate: '보통 상태',
  congested: '혼잡한 상태',
  full: '자리가 없는 상태',
};

const ENVIRONMENT_ITEMS = [
  { icon: <MonitorIcon size={20} />, title: 'PC / 모바일 웹', description: '크롬, 엣지, 사파리 등 최신 브라우저 지원' },
  { icon: <PinIcon size={20} />, title: '위치 기반 서비스', description: '정확한 위치 확인을 위해 위치 접근이 필요합니다.' },
  { icon: <WifiIcon size={20} />, title: '인터넷 연결', description: '실시간 정보 확인을 위해 인터넷 연결이 필요합니다.' },
  { icon: <ShieldIcon size={20} />, title: '개인정보 보호', description: '위치 정보는 사용자의 동의 하에 수집되며 안전하게 관리됩니다.' },
];

const REALTIME_INFO_ITEMS = [
  {
    icon: <span className="flex h-5 items-center rounded bg-danger px-1.5 text-[10px] font-bold leading-none text-white">LIVE</span>,
    title: '실시간 데이터란?',
    description: '주차장의 입출차 정보를 기반으로 갱신되는 정보입니다.',
  },
  {
    icon: <RefreshIcon size={18} />,
    title: '업데이트 주기',
    description: '주차장마다 갱신 주기가 다르며, 통신 상황에 따라 지연될 수 있습니다.',
  },
  {
    icon: <InfoIcon size={18} />,
    title: '정확도 안내',
    description: '센서 및 시스템 오류 등으로 실제 주차 가능 대수와 차이가 있을 수 있습니다.',
  },
  {
    icon: <GridIcon size={18} />,
    title: '데이터 출처',
    description: '서울 열린데이터 광장과 공공데이터포털의 공공 주차장 실시간 정보를 활용하고 있어요.',
  },
];

const SUPPORTED_REGIONS = ['서울특별시', '주요 전국 공항', '대전광역시', '강릉시', '진주시'];

const FAQ_ITEMS = [
  {
    question: '실시간 정보는 믿을 수 있나요?',
    answer:
      '각 지자체·기관이 공개한 공공데이터를 그대로 반영하며, 통신 상황이나 센서 오류로 실제 현황과 차이가 있을 수 있어요. 참고용으로 활용해주세요.',
  },
  {
    question: '정보가 업데이트되지 않는 주차장이 있어요.',
    answer: '일부 주차장은 원본 데이터 제공 기관의 사정으로 갱신이 지연되거나 일시적으로 중단될 수 있어요.',
  },
  {
    question: '공영주차장만 제공되나요?',
    answer: '현재는 공영주차장 위주로 제공하고 있으며, 민영주차장은 데이터 제공 여부에 따라 순차적으로 추가할 예정이에요.',
  },
  {
    question: '주차 요금은 어떻게 확인하나요?',
    answer: '주차장 상세 정보의 "주차요금" 항목에서 기본요금과 추가요금을 확인할 수 있어요.',
  },
  {
    question: '문의 사항은 어디로 연락하나요?',
    answer: '이 페이지 하단의 "1:1 문의하기" 버튼을 통해 GitHub Issues로 남겨주시면 확인 후 답변드릴게요.',
  },
];

/** "이용안내" 페이지: 서비스 소개, 이용 방법, 혼잡도 색상 안내, 실시간 정보, FAQ */
export function GuideScreen() {
  return (
    <div className="h-full overflow-y-auto bg-white">
      <section className="bg-primary-light">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 md:flex-row md:items-stretch md:justify-between">
          <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
            <div className="flex items-center gap-2">
              <LogoMark size={36} />
              <h1 className="text-xl font-extrabold text-text-primary md:text-2xl">이용 안내</h1>
            </div>
            <p className="max-w-md text-sm text-text-secondary">
              ParkFlow는 전국 공영주차장의 실시간 주차 가능 정보를 제공하여 더 편리한 주차 경험을 만들어드립니다.
            </p>
          </div>
          <GuideHeroIllustration className="h-32 w-full max-w-sm shrink-0 md:h-auto md:w-80" />
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-10">
          <section>
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

          <section>
            <h2 className="text-lg font-bold text-text-primary">지원 지역</h2>
            <p className="mt-1 text-xs text-text-secondary">
              현재 서울특별시, 주요 전국 공항, 대전광역시, 강릉시, 진주시 5개 지역 106개 주차장의 실시간 정보를 제공하고 있어요. 지원
              지역은 순차적으로 확대될 예정입니다.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              {SUPPORTED_REGIONS.map((region) => (
                <div key={region} className="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 p-4 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-card">
                    <PinIcon size={22} />
                  </span>
                  <p className="text-sm font-bold text-text-primary">{region}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">혼잡도 색상 안내</h2>
            <p className="mt-1 text-xs text-text-secondary">주차장 혼잡도는 아래와 같은 기준으로 표시됩니다.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
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
                    <p className="mt-2 text-xs font-semibold text-text-primary">{CONGESTION_RANGE_TEXT[level]}</p>
                    <p className="text-xs text-text-secondary">{CONGESTION_SUBTEXT[level]}</p>
                  </div>
                );
              })}
              <div className="rounded-2xl border border-divider p-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-gray-300" />
                  <span className="text-sm font-bold text-text-secondary">정보 없음</span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">데이터가 없거나 제공되지 않음</p>
              </div>
            </div>
          </section>

          <section>
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
        </div>

        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-divider p-5">
            <h2 className="text-base font-bold text-text-primary">실시간 정보 안내</h2>
            <div className="mt-4 flex flex-col gap-4">
              {REALTIME_INFO_ITEMS.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-primary">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary">자주 묻는 질문</h2>
            <div className="mt-4">
              <FaqAccordion items={FAQ_ITEMS} />
            </div>
          </section>
        </div>
      </div>

      <section className="border-t border-divider bg-gray-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-card">
            <BellIcon size={20} />
          </span>
          <p className="text-sm font-bold text-text-primary">고객센터</p>
          <p className="max-w-md text-xs text-text-secondary">
            서비스 이용 중 문제가 발생하면 언제든지 GitHub Issues로 문의해주세요. 아직 별도 상담 채널은 준비 중이에요.
          </p>
          <Link
            href="https://github.com/ulimgo995-commits/parksense/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            1:1 문의하기
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
