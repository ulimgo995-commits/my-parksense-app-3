import { Spinner } from '@/components/common/Spinner';

interface CurrentLocationButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

/** 우측 하단 원형 Floating Button - 현재 위치로 지도 이동 */
export function CurrentLocationButton({ onClick, isLoading = false, className = '' }: CurrentLocationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="현재 위치로 이동"
      className={`flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-floating transition-transform duration-200 ease-out hover:scale-110 active:scale-95 ${className}`}
    >
      {isLoading ? (
        <Spinner size={20} />
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3.5" fill="currentColor" />
          <path
            d="M12 2v3M12 19v3M22 12h-3M5 12H2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
