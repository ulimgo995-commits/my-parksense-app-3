import Link from 'next/link';
import { LogoMark } from '@/components/common/Logo';

const SECTIONS = [
  {
    title: '1. 수집하는 개인정보 항목',
    body: [
      '위치정보: 브라우저의 위치 정보 접근 권한을 허용한 경우에만 기기의 GPS·Wi-Fi 기반 위치를 수집합니다.',
      '서비스 이용 기록: 즐겨찾기에 추가한 주차장, 길찾기 요청 로그를 수집합니다. 이 정보는 특정 개인을 식별할 수 있는 값(이름, 이메일, 기기 ID 등)을 포함하지 않습니다.',
    ],
  },
  {
    title: '2. 개인정보의 수집 및 이용 목적',
    body: [
      '위치정보: 현재 위치를 기준으로 주변 주차장을 탐색하고, 지도 중심 이동과 목적지까지의 거리를 계산하기 위해 이용합니다.',
      '서비스 이용 기록: 즐겨찾기 기능 제공, 인기 주차장 통계 등 서비스 품질 개선을 위해 이용합니다.',
    ],
  },
  {
    title: '3. 개인정보의 보유 및 이용 기간',
    body: [
      '위치정보는 서버에 저장되지 않으며, 브라우저에서만 일시적으로 처리된 뒤 페이지를 벗어나면 즉시 소멸됩니다.',
      '즐겨찾기·길찾기 기록은 별도의 회원가입 절차가 없어 특정 개인과 연결하여 식별할 수 없으며, 서비스 운영 목적 달성에 필요한 기간 동안 보관 후 파기합니다.',
    ],
  },
  {
    title: '4. 개인정보의 제3자 제공',
    body: [
      '수집한 정보를 원칙적으로 외부에 제공하지 않습니다.',
      '다만 지도 화면 표시를 위해 카카오맵 SDK를 이용하며, 이 과정에서 이용자의 브라우저가 카카오 서버와 직접 통신할 수 있습니다.',
    ],
  },
  {
    title: '5. 이용자의 권리와 행사 방법',
    body: [
      '위치정보 제공에 대한 동의는 언제든지 브라우저 설정에서 거부하거나 철회할 수 있으며, 이 경우 주변 주차장 탐색 등 위치 기반 기능 이용이 제한될 수 있습니다.',
      '즐겨찾기에 추가한 주차장은 앱 내에서 직접 삭제할 수 있습니다.',
    ],
  },
  {
    title: '6. 개인정보 보호책임자 및 문의처',
    body: ['개인정보 관련 문의 사항은 아래 GitHub Issues를 통해 남겨주시면 확인 후 답변드립니다.'],
  },
];

/** "/privacy" 개인정보처리방침 페이지 */
export function PrivacyScreen() {
  return (
    <div className="h-full overflow-y-auto bg-white">
      <section className="bg-primary-light">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-6 py-10 text-center">
          <LogoMark size={36} />
          <h1 className="text-xl font-extrabold text-text-primary md:text-2xl">개인정보처리방침</h1>
          <p className="max-w-md text-sm text-text-secondary">
            ParkFlow는 이용자의 개인정보를 소중히 여기며, 최소한의 정보만 수집·이용합니다.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-bold text-text-primary">{section.title}</h2>
            <div className="mt-2 flex flex-col gap-1.5">
              {section.body.map((line) => (
                <p key={line} className="text-sm leading-relaxed text-text-secondary">
                  {line}
                </p>
              ))}
            </div>
          </section>
        ))}

        <Link
          href="https://github.com/ulimgo995-commits/parksense/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          1:1 문의하기
          <span aria-hidden="true">→</span>
        </Link>

        <p className="text-xs text-text-secondary">시행일: 2026년 7월 10일</p>
      </div>
    </div>
  );
}
