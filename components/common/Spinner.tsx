interface SpinnerProps {
  size?: number;
  className?: string;
}

/** 로딩 스피너 (지도/데이터 초기 로딩 시 사용) */
export function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin text-primary ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="로딩 중"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z"
      />
    </svg>
  );
}
