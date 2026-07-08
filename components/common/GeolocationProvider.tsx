'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGeolocation, type GeolocationErrorReason } from '@/hooks/useGeolocation';
import type { AsyncStatus, LatLng } from '@/types/parking';

interface GeolocationContextValue {
  position: LatLng | null;
  tentativePosition: LatLng | null;
  status: AsyncStatus;
  errorReason: GeolocationErrorReason | null;
  requestLocation: () => void;
}

const GeolocationContext = createContext<GeolocationContextValue | null>(null);

/**
 * 앱 전체에서 위치 조회를 딱 한 번만 수행하고 그 결과를 모든 페이지가 공유합니다.
 *
 * 예전엔 홈/주차장 찾기/즐겨찾기 각 화면이 각자 useGeolocation()을 따로 호출했는데, 그러면
 * 페이지를 이동할 때마다(예: 홈 → 주차장 찾기) 처음부터 새로 위치를 조회하게 됩니다. Wi-Fi 기반
 * 위치 조회는 같은 기기에서도 호출할 때마다 결과가 달라질 수 있어서(운 좋으면 정확한 값, 운
 * 나쁘면 엉뚱한 지역), "홈에서는 파란 점이 정확했는데 다른 페이지로 넘어가니 엉뚱한 곳으로
 * 바뀌는" 문제가 있었습니다. app/layout.tsx는 페이지 이동 시 다시 마운트되지 않으므로, 여기서
 * 한 번만 조회해 컨텍스트로 공유하면 어느 페이지로 이동하든 같은(이미 확정된) 값을 그대로
 * 재사용합니다.
 */
export function GeolocationProvider({ children }: { children: ReactNode }) {
  const value = useGeolocation();
  const { requestLocation } = value;
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;
    requestLocation();
  }, [requestLocation]);

  return <GeolocationContext.Provider value={value}>{children}</GeolocationContext.Provider>;
}

export function useSharedGeolocation(): GeolocationContextValue {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error('useSharedGeolocation은 GeolocationProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
