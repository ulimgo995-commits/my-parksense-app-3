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
 * 최초 위치를 받은 뒤 이 시간(ms)들이 지날 때마다 한 번씩 더 재조회합니다. "현재 위치" 버튼을
 * 몇 초 뒤 눌렀을 때 정확한 값이 나오는 이유는 버튼 자체가 특별해서가 아니라, 그만큼 시간이 지나
 * OS의 Wi-Fi 기반 위치 확정이 끝났기 때문입니다.
 *
 * 확정 위치(position)는 이 배열의 "마지막" 재조회 결과만 사용합니다. 중간 결과들(최초 응답,
 * 3초/6초 뒤 재조회)은 tentativePosition으로만 내려 "확인 중" 점을 보여줄 뿐, 확정에는 반영하지
 * 않습니다.
 *
 * 처음엔 "연속된 두 응답이 서로 가까운지"로 교차 검증해 더 빨리 확정해보려 했는데, 실제로
 * 테스트해보니 오히려 역효과였습니다 — 초반 응답들(최초 + 3초 재조회)이 GPS가 아니라 IP/Wi-Fi
 * 라우터 기반의 "동일하게 틀린" 위치(예: 실제 위치와 무관한 다른 시청)를 반복해서 반환하는
 * 경우가 있어서, 그 둘이 서로 "합의"돼버려 진짜 위치가 나오기도 전에 틀린 값으로 확정돼버렸기
 * 때문입니다. 그래서 지금은 조기 확정을 아예 포기하고, 매번 실제로 정확한 값이 나왔던 마지막
 * 재조회(약 10초 뒤)까지 무조건 기다렸다가 그 값 하나로만 확정합니다 — 느리지만 "여러 번 튀거나
 * 틀린 곳에서 멈추는" 것보다 "한 번에 정확한 곳으로 도착하는" 쪽이 우선입니다.
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
  // 마지막 재조회 자체가 실패했을 때 대신 확정할 수 있도록, 지금까지 받은 응답 중 가장 최근 것을
  // 기억해둡니다.
  const lastCandidateRef = useRef<LatLng | null>(null);

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
    lastCandidateRef.current = null;
    setState((prev) => ({ ...prev, tentativePosition: null, status: 'loading' }));

    // 마지막 시도가 아니면 tentativePosition만 갱신("확인 중" 점 표시용, 확정하지 않음).
    // 마지막 시도면 그 값으로 곧바로 확정합니다.
    const handleCandidate = (raw: LatLng, isLastAttempt: boolean) => {
      if (requestIdRef.current !== requestId) return;
      lastCandidateRef.current = raw;
      if (isLastAttempt) {
        setState({ position: raw, tentativePosition: null, status: 'success', errorReason: null });
      } else {
        setState((prev) => ({ ...prev, tentativePosition: raw }));
      }
    };

    navigator.geolocation.getCurrentPosition(
      (result) => {
        handleCandidate({ lat: result.coords.latitude, lng: result.coords.longitude }, false);

        REFINE_DELAYS_MS.forEach((delay, index) => {
          const isLastAttempt = index === REFINE_DELAYS_MS.length - 1;
          const timeoutId = window.setTimeout(() => {
            if (requestIdRef.current !== requestId) return;
            navigator.geolocation.getCurrentPosition(
              (refined) => handleCandidate({ lat: refined.coords.latitude, lng: refined.coords.longitude }, isLastAttempt),
              () => {
                if (requestIdRef.current !== requestId) return;
                // 마지막 재조회 자체가 실패했다면, 지금까지 받은 것 중 가장 최근 응답이라도
                // 확정합니다(계속 'loading'으로 두는 것보다 낫습니다).
                const lastCandidate = lastCandidateRef.current;
                setState((prev) =>
                  isLastAttempt && !prev.position && lastCandidate
                    ? { position: lastCandidate, tentativePosition: null, status: 'success', errorReason: null }
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
