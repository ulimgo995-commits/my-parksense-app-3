const APP_VERSION = '0.1.0';

/** "내 정보" 탭: 로그인 시스템이 없는 MVP 단계의 간단한 앱 정보 화면 */
export function ProfileView() {
  return (
    <div className="flex h-full flex-col bg-white">
      <header className="border-b border-divider px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-lg font-bold text-text-primary">내 정보</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+88px)]">
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
            P
          </div>
          <p className="text-base font-bold text-text-primary">ParkSense</p>
          <p className="text-xs text-text-secondary">버전 {APP_VERSION}</p>
        </div>

        <div className="mt-8 space-y-3 rounded-xl bg-gray-50 p-4 text-sm text-text-secondary">
          <p>
            ParkSense는 서울 공영주차장의 혼잡도를 지도에서 바로 확인할 수 있도록 도와주는 목적지 기반 주차장 안내
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
