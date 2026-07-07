'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getDistanceInMeters } from '@/utils/distance';
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
 * OS의 Wi-Fi 기반 위치 확정이 끝났기 때문입니다. 그 타이밍을 자동으로 재현하기 위해 여러 시점에
 * 같은 방식으로 재조회합니다.
 *
 * 예전엔 매번 최신 결과로 그냥 덮어썼는데, 그러면 재조회마다 서로 다른(때로는 완전히 동떨어진)
 * 값이 나와서 확정 위치가 여러 번 옮겨 다니는 것처럼 보였습니다. "정확도(accuracy) 필드로 비교"
 * 방식도 그 필드 자체가 신뢰할 수 없어 실패했었습니다(신뢰할 만한 값을 오히려 걸러내는 부작용).
 * 그래서 이번엔 기기가 스스로 보고하는 정확도를 아예 믿지 않고, 대신 "연속된 두 응답이 서로
 * 가까운 곳을 가리키는지"로 교차 검증합니다(AGREEMENT_THRESHOLD_METERS 이내) — 두 개의 독립된
 * 응답이 우연히 같은 오답에 동시에 도달할 가능성은 낮다고 보는 접근입니다. 합의가 나오는 즉시
 * 그 값을 `position`으로 확정하고 남은 재조회는 취소해, 카메라가 정확한 위치로 딱 한 번만
 * 이동하도록 합니다. 그 전까지는 최신 응답을 `tentativePosition`으로만 내려 "확인 중" 점을
 * 보여줍니다. 끝까지 합의가 안 나오면(마지막 시도까지도) 그래도 가장 최근 값을 확정합니다 —
 * 계속 'loading'으로 남겨두는 것보다는 낫습니다.
 */
const REFINE_DELAYS_MS = [3000, 6000, 10000];
const AGREEMENT_THRESHOLD_METERS = 500;

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
  // 확정 전까지 지금까지 받은 응답들을 순서대로 쌓아둡니다 — 바로 직전 응답과 비교해
  // "합의"가 나왔는지 판단하는 데 씁니다.
  const candidatesRef = useRef<LatLng[]>([]);

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
    candidatesRef.current = [];
    setState((prev) => ({ ...prev, tentativePosition: null, status: 'loading' }));

    // 새 응답이 도착할 때마다 호출합니다. 직전 응답과 AGREEMENT_THRESHOLD_METERS 이내로 가까우면
    // 그 값으로 확정하고 남은 재조회는 취소합니다. 마지막 시도까지 합의가 안 나오면 그 마지막
    // 값을 그냥 확정합니다.
    const handleCandidate = (raw: LatLng, isLastAttempt: boolean) => {
      if (requestIdRef.current !== requestId) return;
      const previous = candidatesRef.current[candidatesRef.current.length - 1];
      candidatesRef.current.push(raw);

      const agreesWithPrevious = previous !== undefined && getDistanceInMeters(previous, raw) <= AGREEMENT_THRESHOLD_METERS;

      if (agreesWithPrevious || isLastAttempt) {
        clearRefineTimeouts();
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
                // 재조회 자체가 실패했고 이게 마지막 시도인데 아직 확정된 위치가 없다면, 지금까지
                // 받은 것 중 가장 최근 응답이라도 확정합니다(계속 'loading'으로 두는 것보다 낫습니다).
                const lastCandidate = candidatesRef.current[candidatesRef.current.length - 1];
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
