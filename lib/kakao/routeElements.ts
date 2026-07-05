/** 현재위치 → 선택된 주차장 사이에 표시할 예상 도착시간/거리 플로팅 카드 DOM 엘리먼트 */
export function createRouteEtaElement(etaMinutes: number, distanceLabel: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-floating';
  el.textContent = `도착까지 ${etaMinutes}분 · ${distanceLabel}`;
  return el;
}
