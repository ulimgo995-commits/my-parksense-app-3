'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

/** 캐시를 쓰지 않고 그 시점 기준 최신 위치를 강제로 다시 조회할 때 사용합니다. */
const FRESH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 0,
};

/**
 * 최초 위치를 받은 뒤 이 시간(ms)들이 지날 때마다 한 번씩 더 "그냥" 재조회해서 결과를
 * 덮어씁니다. "현재 위치" 버튼을 몇 초 뒤 눌렀을 때 정확한 값이 나오는 이유는 버튼 자체가
 * 특별해서가 아니라, 그만큼 시간이 지나 OS의 Wi-Fi 기반 위치 확정이 끝났기 때문입니다.
 * 그 타이밍을 자동으로 재현하기 위해 여러 시점에 같은 방식으로 재조회합니다.
 * (이전에 시도했던 "정확도(accuracy) 필드로 비교해서 더 나은 값만 채택" 방식은, 그 필드 자체가
 * 신뢰할 수 없어 오히려 나중에 온 정답을 걸러내는 부작용이 있었습니다 — 그래서 비교 없이
 * 매번 최신 결과로 그냥 덮어씁니다.)
 */
const REFINE_DELAYS_MS = [3000, 6000, 10000];

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
  const refineTimeoutIdsRef = useRef<number[]>([]);

  const clearRefineTimeouts = useCallback(() => {
    refineTimeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    refineTimeoutIdsRef.current = [];
  }, []);

  useEffect(() => clearRefineTimeouts, [clearRefineTimeouts]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ position: null, status: 'error', errorReason: 'unsupported' });
      return;
    }

    clearRefineTimeouts();
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

        REFINE_DELAYS_MS.forEach((delay) => {
          const timeoutId = window.setTimeout(() => {
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
              // 재조회 실패는 조용히 무시합니다(이미 이전에 얻은 위치가 있음).
              () => {},
              FRESH_OPTIONS
            );
          }, delay);
          refineTimeoutIdsRef.current.push(timeoutId);
        });
      },
      (error) => {
        if (requestIdRef.current !== requestId) return;
        // 이전에 성공적으로 얻은 위치가 있다면 유지하고, 상태/에러 사유만 갱신합니다.
        setState((prev) => ({ position: prev.position, status: 'error', errorReason: mapErrorReason(error) }));
      },
      GEOLOCATION_OPTIONS
    );
  }, [clearRefineTimeouts]);

  return { ...state, requestLocation };
}
