/**
 * Kakao Maps CustomOverlay 에 넣을 순수 DOM 마커 엘리먼트 팩토리.
 *
 * kakao.maps.Marker 기본 이미지 대신 CustomOverlay + DOM 엘리먼트를 사용하면
 * Tailwind 애니메이션(scale, bounce, pulse 등)을 그대로 적용할 수 있어
 * 지도/디자인 가이드에서 요구하는 "확대 애니메이션 + Bounce 효과"를 자연스럽게 구현할 수 있습니다.
 */

interface ParkingMarkerElements {
  root: HTMLDivElement;
  pin: HTMLDivElement;
  label: HTMLDivElement;
}

interface CreateParkingMarkerOptions {
  color: string;
  availableSpaces: number;
  statusLabel: string;
  onClick: () => void;
}

export function createParkingMarkerElement({
  color,
  availableSpaces,
  statusLabel,
  onClick,
}: CreateParkingMarkerOptions): ParkingMarkerElements {
  const root = document.createElement('div');
  root.className = 'flex cursor-pointer flex-col items-center gap-1 animate-marker-pop';
  root.style.transformOrigin = 'bottom center';

  const pin = document.createElement('div');
  pin.className =
    'flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white text-base shadow-floating transition-transform duration-200 ease-out';
  pin.style.backgroundColor = color;
  pin.textContent = 'P';
  pin.style.color = '#FFFFFF';
  pin.style.fontWeight = '700';

  const tail = document.createElement('div');
  tail.style.width = '0';
  tail.style.height = '0';
  tail.style.marginTop = '-2px';
  tail.style.borderLeft = '7px solid transparent';
  tail.style.borderRight = '7px solid transparent';
  tail.style.borderTop = `8px solid ${color}`;

  const pinWrap = document.createElement('div');
  pinWrap.className = 'flex flex-col items-center';
  pinWrap.appendChild(pin);
  pinWrap.appendChild(tail);

  // 핀 아래 "면수 + 상태" 라벨 카드 (디자인 참고: 흰 배경 카드에 숫자/상태 텍스트)
  const label = document.createElement('div');
  label.className =
    'flex flex-col items-center rounded-md bg-white px-1.5 py-0.5 leading-none shadow-card';

  const spacesText = document.createElement('span');
  spacesText.className = 'text-[11px] font-bold text-text-primary';
  spacesText.textContent = `${availableSpaces}면`;

  const statusText = document.createElement('span');
  statusText.className = 'text-[10px] font-semibold';
  statusText.style.color = color;
  statusText.textContent = statusLabel;

  label.appendChild(spacesText);
  label.appendChild(statusText);

  // 라벨을 핀 "위"에 배치해야 핀 꼬리(root 맨 아래)가 실제 좌표와 정확히 일치합니다
  // (CustomOverlay yAnchor=1 이 root의 맨 아래를 좌표에 고정하기 때문).
  root.appendChild(label);
  root.appendChild(pinWrap);
  root.addEventListener('click', onClick);

  return { root, pin, label };
}

/** 선택된 마커에 확대 + Bounce 효과를 적용/해제합니다. */
export function setParkingMarkerSelected(elements: ParkingMarkerElements, selected: boolean): void {
  if (selected) {
    elements.pin.classList.add('scale-125', 'ring-4', 'ring-primary/30');
    elements.root.classList.add('animate-marker-bounce');
    elements.root.style.zIndex = '10';
  } else {
    elements.pin.classList.remove('scale-125', 'ring-4', 'ring-primary/30');
    elements.root.classList.remove('animate-marker-bounce');
    elements.root.style.zIndex = '0';
  }
}

function applyClusterSize(el: HTMLDivElement, count: number): void {
  const size = count < 10 ? 38 : count < 50 ? 46 : count < 200 ? 54 : 62;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.fontSize = count < 100 ? '13px' : '12px';
}

/** 마커가 많이 겹칠 때 대신 표시하는 클러스터(묶음) 마커 */
export function createClusterElement(count: number, onClick: () => void): HTMLDivElement {
  const root = document.createElement('div');
  root.className =
    'flex cursor-pointer items-center justify-center rounded-full border-2 border-white bg-primary font-bold text-white shadow-floating transition-transform duration-200 ease-out hover:scale-110 animate-marker-pop';
  applyClusterSize(root, count);
  root.textContent = String(count);
  root.addEventListener('click', onClick);
  return root;
}

/** 클러스터에 속한 주차장 개수가 바뀌었을 때(뷰포트 이동 등) 기존 DOM을 재사용하며 갱신 */
export function updateClusterElement(el: HTMLDivElement, count: number): void {
  el.textContent = String(count);
  applyClusterSize(el, count);
}

export function createUserLocationElement(): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'relative flex h-4 w-4 items-center justify-center';

  const ring = document.createElement('span');
  ring.className = 'absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-primary';

  const dot = document.createElement('span');
  dot.className = 'relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-primary shadow-floating';

  root.appendChild(ring);
  root.appendChild(dot);

  return root;
}

/**
 * 아직 재조회로 검증되지 않은 "확인 중" 위치용 마커. 확정 마커(파란색, createUserLocationElement)와
 * 일부러 다르게(회색 + 반투명) 만들어서, 정확한 값이 아닐 수 있다는 걸 시각적으로 구분해줍니다.
 */
export function createTentativeUserLocationElement(): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'relative flex h-4 w-4 items-center justify-center opacity-70';

  const ring = document.createElement('span');
  ring.className = 'absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-gray-400';

  const dot = document.createElement('span');
  dot.className = 'relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-gray-400 shadow-floating';

  root.appendChild(ring);
  root.appendChild(dot);

  return root;
}
