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
  /** 기본값(대전광역시청 좌표 등)으로 폴백하지 않고, 순수하게 위치 요청만 트리거합니다. */
  requestLocation: () => void;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 30000,
};

/** 정확도 재요청(REFINE_OPTIONS)까지의 대기 시간 — 브라우저가 Wi-Fi 기반 위치를 마저 확정할 시간을 줍니다. */
const REFINE_DELAY_MS = 2500;

/** 캐시를 절대 쓰지 않고 그 시점 기준 최신 위치를 강제로 다시 조회할 때 사용합니다. */
const REFINE_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 0,
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
  // 데스크톱 브라우저는 최초 요청 시 IP/캐시 기반의 부정확한 위치를 먼저 반환하고, 잠시 후
  // 다시 요청하면 Wi-Fi 기반의 훨씬 정확한 위치를 주는 경우가 많습니다(수동으로 "현재 위치"
  // 버튼을 눌렀을 때만 정확한 위치가 나오던 문제의 원인). 세션당 한 번만 자동으로 재요청해
  // 조용히 더 정확한 위치로 갱신합니다.
  const didRefineRef = useRef(false);

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

        if (!didRefineRef.current) {
          didRefineRef.current = true;
          window.setTimeout(() => {
            if (requestIdRef.current !== requestId) return;
            navigator.geolocation.getCurrentPosition(
              (refined) => {
                if (requestIdRef.current !== requestId) return;
                setState({
                  position: { lat: refined.coords.latitude, lng: refined.coords.longitude },
                  status: 'success',
                  errorReason: null,
                });
              },
              // 정밀 재요청이 실패해도 이미 최초 위치가 있으므로 조용히 무시합니다.
              () => {},
              REFINE_OPTIONS
            );
          }, REFINE_DELAY_MS);
        }
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
