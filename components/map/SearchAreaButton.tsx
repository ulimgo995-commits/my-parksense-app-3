import { RefreshIcon } from '@/components/common/icons';

interface SearchAreaButtonProps {
  onClick: () => void;
  className?: string;
}

/** 지도를 드래그했을 때 나타나는 "이 지역 검색" 플로팅 버튼 */
export function SearchAreaButton({ onClick, className = '' }: SearchAreaButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`animate-fade-in-up flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-primary shadow-floating transition-transform duration-200 hover:scale-105 ${className}`}
    >
      <RefreshIcon />
      이 지역 검색
    </button>
  );
}
