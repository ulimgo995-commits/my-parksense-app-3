'use client';

import { useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';

/** Next.js App Router 전역 에러 바운더리 (예기치 못한 렌더링 오류 대응) */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[ParkSense] Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-white">
      <EmptyState
        icon="😵"
        title="예기치 못한 오류가 발생했어요"
        description="화면을 새로고침해도 문제가 계속되면 잠시 후 다시 시도해주세요."
        action={
          <Button variant="primary" onClick={reset} className="mt-2">
            다시 시도
          </Button>
        }
      />
    </div>
  );
}
