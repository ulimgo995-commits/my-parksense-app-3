'use client';

import { useEffect, useState } from 'react';
import { loadKakaoMapSdk } from '@/lib/kakao/loadKakaoMapSdk';
import type { AsyncStatus } from '@/types/parking';

interface UseKakaoLoaderResult {
  status: AsyncStatus;
  error: string | null;
}

/**
 * Kakao Maps SDK 로드 상태를 관리하는 훅.
 * NEXT_PUBLIC_KAKAO_MAP_API_KEY 가 없으면 즉시 에러 상태로 전환하여
 * MapErrorState UI가 표시되도록 합니다.
 */
export function useKakaoLoader(): UseKakaoLoaderResult {
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

    if (!appKey) {
      setStatus('error');
      setError('Kakao Maps API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
      return;
    }

    let cancelled = false;

    loadKakaoMapSdk(appKey)
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setStatus('error');
          setError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, error };
}
