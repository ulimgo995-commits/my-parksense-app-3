'use client';

import { useEffect, useState } from 'react';

/** 값 변경 후 delay(ms) 동안 추가 변경이 없을 때만 최신 값을 반영하는 디바운스 훅 */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
