import { RefreshIcon } from '@/components/common/icons';

interface SearchAreaButtonProps {
  onClick: () => void;
}

/** 사용자가 지도를 직접 드래그/확대·축소했을 때만 나타나는 "이 지역 재검색" 플로팅 버튼 */
export function SearchAreaButton({ onClick }: SearchAreaButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-fade-in-up flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-floating transition-colors hover:bg-primary-dark"
    >
      <RefreshIcon size={14} />
      이 지역 재검색
    </button>
  );
}
