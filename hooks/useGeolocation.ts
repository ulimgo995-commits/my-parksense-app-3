'use client';

import { useCallback, useRef, useState } from 'react';
import type { AsyncStatus, LatLng } from '@/types/parking';

export type GeolocationErrorReason = 'permission-denied' | 'position-unavailable' | 'timeout' | 'unsupported';

interface UseGeolocationState {
  position: LatLng | null;
  status: AsyncStatus;
  errorReason: GeolocationErrorReason | null;
}

interface UseGeolocationResult extends UseGeolocationState {
  /** 서울시청 좌표 등 기본값으로 폴백하지 않고, 순수하게 위치 요청만 트리거합니다. */
  requestLocation: () => void;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 30000,
};

function mapErrorReason(error: GeolocationPositionError): GeolocationErrorReason {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'permission-denied';
    case error.POSITION_UNAVAILABLE:
      return 'position-unavailable';
    case error.TIMEOUT:
      return 'timeout';
    default:
      return 'position-unavailable';
  }
}

/**
 * 브라우저 Geolocation API 래퍼 훅.
 * 위치 권한 거부/타임아웃 등의 실패 사유를 구분해 UI에서 적절한 안내를 할 수 있도록 합니다.
 */
export function useGeolocation(): UseGeolocationResult {
  const [state, setState] = useState<UseGeolocationState>({
    position: null,
    status: 'idle',
    errorReason: null,
  });

  const requestIdRef = useRef(0);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ position: null, status: 'error', errorReason: 'unsupported' });
      return;
    }

    const requestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, status: 'loading' }));

    navigator.geolocation.getCurrentPosition(
      (result) => {
        if (requestIdRef.current !== requestId) return;
        setState({
          position: { lat: result.coords.latitude, lng: result.coords.longitude },
          status: 'success',
          errorReason: null,
        });
      },
      (error) => {
        if (requestIdRef.current !== requestId) return;
        // 이전에 성공적으로 얻은 위치가 있다면 유지하고, 상태/에러 사유만 갱신합니다.
        setState((prev) => ({ position: prev.position, status: 'error', errorReason: mapErrorReason(error) }));
      },
      GEOLOCATION_OPTIONS
    );
  }, []);

  return { ...state, requestLocation };
}
