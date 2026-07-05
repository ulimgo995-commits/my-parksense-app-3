import { Button } from '@/components/common/Button';

interface MapErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** 카카오맵 SDK 로드 실패 시 표시되는 에러 UI */
export function MapErrorState({ message, onRetry }: MapErrorStateProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50 px-8 text-center animate-fade-in">
      <div className="text-4xl">🗺️</div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-text-primary">지도를 불러오지 못했습니다</p>
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
      <Button variant="primary" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
