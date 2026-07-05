import { CloseIcon } from '@/components/common/icons';
import type { GeolocationErrorReason } from '@/hooks/useGeolocation';

interface LocationPermissionBannerProps {
  reason: GeolocationErrorReason;
  onRetry: () => void;
  onDismiss: () => void;
}

const MESSAGE_BY_REASON: Record<GeolocationErrorReason, string> = {
  'permission-denied': '위치 권한이 거부되어 서울시청을 기준으로 지도를 표시하고 있어요. 브라우저 설정에서 위치 권한을 허용해주세요.',
  'position-unavailable': '현재 위치를 확인할 수 없어요. 잠시 후 다시 시도해주세요.',
  timeout: '위치 확인이 지연되고 있어요. 다시 시도해주세요.',
  unsupported: '이 브라우저는 위치 확인 기능을 지원하지 않아요.',
};

/** 위치 권한 거부/실패 시 표시되는 안내 배너 (디자인 가이드 14. 예외 처리) */
export function LocationPermissionBanner({ reason, onRetry, onDismiss }: LocationPermissionBannerProps) {
  return (
    <div className="animate-fade-in-up flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-floating">
      <div className="mt-0.5 text-lg">📍</div>
      <p className="flex-1 text-sm leading-relaxed text-text-primary">{MESSAGE_BY_REASON[reason]}</p>
      <div className="flex shrink-0 items-center gap-1">
        {reason !== 'permission-denied' && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full px-2.5 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
          >
            재시도
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="배너 닫기"
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-gray-100"
        >
          <CloseIcon size={12} />
        </button>
      </div>
    </div>
  );
}
