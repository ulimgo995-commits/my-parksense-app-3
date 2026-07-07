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
  maximumAge: 0,
};

/** 이 정확도(미터) 이하로 들어오면 충분히 정확하다고 보고 더 이상 위치를 감시하지 않습니다. */
const GOOD_ENOUGH_ACCURACY_METERS = 100;
/** 배터리/권한 표시를 계속 켜두지 않도록, 이 시간이 지나면 감시를 강제로 종료합니다. */
const MAX_WATCH_DURATION_MS = 10000;

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
 *
 * PC 브라우저는 최초 위치를 IP/캐시 기반의 부정확한 값으로 먼저 주고, 잠시 후에야 Wi-Fi 기반의
 * 정확한 값을 확정하는 경우가 많습니다(수동으로 "현재 위치" 버튼을 다시 눌렀을 때만 정확한 위치가
 * 나오던 문제의 원인). getCurrentPosition을 한 번만 호출하는 대신 watchPosition으로 감시하다가,
 * 더 정확한 값(정확도 반경이 더 작은 값)이 들어올 때마다 즉시 갱신하고, 충분히 정확해지거나
 * 일정 시간이 지나면 감시를 종료합니다. 고정된 시간을 기다리지 않고 "정확해지는 즉시" 반영됩니다.
 */
export function useGeolocation(): UseGeolocationResult {
  const [state, setState] = useState<UseGeolocationState>({
    position: null,
    status: 'idle',
    errorReason: null,
  });

  const requestIdRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const bestAccuracyRef = useRef(Infinity);
  const stopTimeoutRef = useRef<number | null>(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ position: null, status: 'error', errorReason: 'unsupported' });
      return;
    }

    stopWatching();
    const requestId = ++requestIdRef.current;
    bestAccuracyRef.current = Infinity;
    setState((prev) => ({ ...prev, status: 'loading' }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (result) => {
        if (requestIdRef.current !== requestId) return;

        // 더 정확한(정확도 반경이 더 작은) 값이 들어왔을 때만 갱신합니다 — 흔들리며 다시
        // 부정확해지는 값으로 되돌아가지 않도록 하기 위함입니다.
        if (result.coords.accuracy > bestAccuracyRef.current) return;
        bestAccuracyRef.current = result.coords.accuracy;

        setState({
          position: { lat: result.coords.latitude, lng: result.coords.longitude },
          status: 'success',
          errorReason: null,
        });

        if (result.coords.accuracy <= GOOD_ENOUGH_ACCURACY_METERS) stopWatching();
      },
      (error) => {
        if (requestIdRef.current !== requestId) return;
        // 이전에 성공적으로 얻은 위치가 있다면 유지하고, 상태/에러 사유만 갱신합니다.
        setState((prev) => ({ position: prev.position, status: 'error', errorReason: mapErrorReason(error) }));
      },
      GEOLOCATION_OPTIONS
    );

    stopTimeoutRef.current = window.setTimeout(stopWatching, MAX_WATCH_DURATION_MS);
  }, [stopWatching]);

  return { ...state, requestLocation };
}
