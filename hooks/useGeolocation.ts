'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AsyncStatus, LatLng } from '@/types/parking';

export type GeolocationErrorReason = 'permission-denied' | 'position-unavailable' | 'timeout' | 'unsupported';

interface UseGeolocationState {
  position: LatLng | null;
  /**
   * 아직 재조회로 검증되지 않은, 최초 응답 그대로의 위치입니다. 반경 필터/정렬/카메라 이동처럼
   * "정확해야 의미 있는" 용도에는 절대 쓰지 말고, 지도 위에 "위치 확인 중" 느낌의 흐릿한 점을
   * 즉시 보여주는 등 순수 시각적 피드백 용도로만 사용하세요. position이 채워지면 함께 비워집니다.
   */
  tentativePosition: LatLng | null;
  status: AsyncStatus;
  errorReason: GeolocationErrorReason | null;
}

interface UseGeolocationResult extends UseGeolocationState {
  /** 기본값(서울특별시청 좌표 등)으로 폴백하지 않고, 순수하게 위치 요청만 트리거합니다. */
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
 *
 * 최초 조회 결과를 그대로 `position`(확정 위치)에 반영하지 않는 이유: 데스크톱 Wi-Fi 기반
 * 위치는 첫 응답이 실제와 전혀 무관한 곳(엉뚱한 산, 섬 등)을 가리키는 경우가 잦고, 그걸 바로
 * 반경 필터/정렬/카메라 이동에 반영했다가 몇 초 뒤 정답으로 다시 튀는 모습은 "빠른 의사결정"을
 * 돕는다는 서비스 취지와 반대로 오히려 신뢰도를 떨어뜨립니다. 그래서 `position`은 이 배열의 첫
 * 재조회(3초 뒤) 결과부터 채워지고, 그 전까지 status는 'loading'을 유지합니다. 다만 최초 응답은
 * `tentativePosition`으로 즉시 내려줘서, 지도 위에 "위치 확인 중" 점만 먼저 보여주는 식으로 아예
 * 아무 피드백이 없는 것보다는 빠르게 무언가 보여줄 수 있게 했습니다.
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
    tentativePosition: null,
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
      setState({ position: null, tentativePosition: null, status: 'error', errorReason: 'unsupported' });
      return;
    }

    clearRefineTimeouts();
    const requestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, tentativePosition: null, status: 'loading' }));

    navigator.geolocation.getCurrentPosition(
      (result) => {
        if (requestIdRef.current !== requestId) return;
        // 최초 결과는 확정 위치(position)에는 반영하지 않지만(위 REFINE_DELAYS_MS 설명 참고),
        // tentativePosition으로는 즉시 내려줘서 지도에 "확인 중" 점만 먼저 띄울 수 있게 합니다.
        const rawPosition: LatLng = { lat: result.coords.latitude, lng: result.coords.longitude };
        setState((prev) => ({ ...prev, tentativePosition: rawPosition }));

        REFINE_DELAYS_MS.forEach((delay, index) => {
          const isLastAttempt = index === REFINE_DELAYS_MS.length - 1;
          const timeoutId = window.setTimeout(() => {
            if (requestIdRef.current !== requestId) return;
            navigator.geolocation.getCurrentPosition(
              (refined) => {
                if (requestIdRef.current !== requestId) return;
                setState({
                  position: { lat: refined.coords.latitude, lng: refined.coords.longitude },
                  tentativePosition: null,
                  status: 'success',
                  errorReason: null,
                });
              },
              () => {
                if (requestIdRef.current !== requestId) return;
                // 재조회가 실패했고 이게 마지막 시도인데 아직 한 번도 위치를 보여준 적 없다면
                // (계속 'loading'으로 두는 것보다는 낫다고 보고) 최초의 결과라도 확정 위치로 보여줍니다.
                setState((prev) =>
                  isLastAttempt && !prev.position
                    ? { position: rawPosition, tentativePosition: null, status: 'success', errorReason: null }
                    : prev
                );
              },
              FRESH_OPTIONS
            );
          }, delay);
          refineTimeoutIdsRef.current.push(timeoutId);
        });
      },
      (error) => {
        if (requestIdRef.current !== requestId) return;
        // 이전에 성공적으로 얻은 위치가 있다면 유지하고, 상태/에러 사유만 갱신합니다.
        setState((prev) => ({ ...prev, status: 'error', errorReason: mapErrorReason(error) }));
      },
      GEOLOCATION_OPTIONS
    );
  }, [clearRefineTimeouts]);

  return { ...state, requestLocation };
}
