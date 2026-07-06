import { LogoMark } from '@/components/common/Logo';

const APP_VERSION = '0.1.0';

/** "내 정보" 화면: 로그인 시스템이 없는 MVP 단계의 간단한 앱 정보 화면 */
export function ProfileView() {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col bg-white">
      <header className="border-b border-divider px-5 pb-4 pt-6">
        <h1 className="text-lg font-bold text-text-primary">내 정보</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <LogoMark size={56} />
          <p className="text-base font-bold text-text-primary">
            <span className="text-text-primary">Park</span>
            <span className="text-primary">Flow</span>
          </p>
          <p className="text-xs text-text-secondary">버전 {APP_VERSION}</p>
        </div>

        <div className="mt-8 space-y-3 rounded-xl bg-gray-50 p-4 text-sm text-text-secondary">
          <p>
            ParkFlow는 지원 지역 주차장의 혼잡도를 지도에서 바로 확인할 수 있도록 도와주는 목적지 기반 주차장 안내
            서비스입니다.
          </p>
          <p>현재는 로그인 없이 누구나 즐겨찾기와 길찾기 기능을 사용할 수 있는 MVP 버전입니다.</p>
        </div>

        <div className="mt-4 divide-y divide-divider overflow-hidden rounded-xl border border-divider">
          <a
            href="https://github.com/ulimgo995-commits/parksense"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 text-sm text-text-primary transition-colors hover:bg-gray-50"
          >
            GitHub 저장소
            <span className="text-text-secondary">↗</span>
          </a>
          <div className="px-4 py-3 text-sm text-text-secondary">회원가입 · 로그인은 추후 지원 예정입니다.</div>
        </div>
      </div>
    </div>
  );
}
