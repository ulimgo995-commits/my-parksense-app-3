'use client';

import { useEffect, useState } from 'react';
import { fetchParkingLots } from '@/lib/parking/parkingRepository';
import type { AsyncStatus, ParkingLot } from '@/types/parking';

interface UseParkingLotsResult {
  parkingLots: ParkingLot[];
  status: AsyncStatus;
  error: string | null;
  refetch: () => void;
}

/** `/data/parking_lots.json` 기반 주차장 목록 로딩 훅 (추후 실시간 API로 교체 가능) */
export function useParkingLots(): UseParkingLotsResult {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetchParkingLots()
      .then((lots) => {
        if (cancelled) return;
        setParkingLots(lots);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setError('주차장 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return {
    parkingLots,
    status,
    error,
    refetch: () => setReloadToken((token) => token + 1),
  };
}
