interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** ParkFlow 로고의 파란 핀+자동차 마크만 (좁은 공간/모바일 내비게이션용) */
export function LogoMark({ size = 32, className = '' }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 3c-7.2 0-13 5.7-13 12.8 0 8.6 11 18.4 12 19.3.6.5 1.4.5 2 0 1-.9 12-10.7 12-19.3C33 8.7 27.2 3 20 3Z"
        fill="url(#parkflow-mark-gradient)"
      />
      <path
        d="M13.5 20.5v-2.3a1.4 1.4 0 0 1 .22-.75l1.4-2.24a1.4 1.4 0 0 1 1.18-.66h7.4a1.4 1.4 0 0 1 1.18.66l1.4 2.24c.14.23.22.5.22.75v2.3"
        stroke="white"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="12.3" y="20.5" width="2.3" height="2.3" rx="0.7" fill="white" />
      <rect x="25.4" y="20.5" width="2.3" height="2.3" rx="0.7" fill="white" />
      <path d="M13.5 17.7h13" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
      <defs>
        <linearGradient id="parkflow-mark-gradient" x1="7" y1="3" x2="33" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface LogoProps {
  markSize?: number;
  wordmarkClassName?: string;
  className?: string;
}

/** ParkFlow 아이콘 + 워드마크 (데스크톱 상단 내비게이션 등 공간이 넉넉한 곳용) */
export function Logo({ markSize = 32, wordmarkClassName = 'text-xl', className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={markSize} />
      <span className={`font-extrabold tracking-tight ${wordmarkClassName}`}>
        <span className="text-text-primary">Park</span>
        <span className="text-primary">Flow</span>
      </span>
    </span>
  );
}
