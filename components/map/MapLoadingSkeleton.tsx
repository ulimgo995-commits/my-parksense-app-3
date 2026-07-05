import { Skeleton } from '@/components/common/Skeleton';
import { Spinner } from '@/components/common/Spinner';

/** 카카오맵 SDK 로딩 중 표시되는 스켈레톤 UI */
export function MapLoadingSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col bg-gray-100">
      <div className="relative flex-1 overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute left-1/4 top-1/3 h-3 w-16 rounded-full bg-gray-300/70" />
        <div className="absolute left-2/3 top-1/2 h-3 w-20 rounded-full bg-gray-300/70" />
        <div className="absolute left-1/3 top-2/3 h-3 w-14 rounded-full bg-gray-300/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Spinner size={32} />
          <p className="text-sm font-medium text-text-secondary">지도를 불러오는 중이에요</p>
        </div>
      </div>
    </div>
  );
}
