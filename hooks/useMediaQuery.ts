'use client';

import { useEffect, useState } from 'react';

/** CSS media query 매치 여부를 구독하는 훅 (SSR 안전: 초기값 false) */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/** Tailwind `md` 브레이크포인트(768px) 이상 여부 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
