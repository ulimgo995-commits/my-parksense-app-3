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
}

export function createParkingMarkerElement(color: string, onClick: () => void): ParkingMarkerElements {
  const root = document.createElement('div');
  root.className = 'flex cursor-pointer flex-col items-center animate-marker-pop';
  root.style.transformOrigin = 'bottom center';

  const pin = document.createElement('div');
  pin.className =
    'flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white text-sm shadow-floating transition-transform duration-200 ease-out';
  pin.style.backgroundColor = color;
  pin.textContent = 'P';
  pin.style.color = '#FFFFFF';
  pin.style.fontWeight = '700';

  const tail = document.createElement('div');
  tail.style.width = '0';
  tail.style.height = '0';
  tail.style.marginTop = '-2px';
  tail.style.borderLeft = '6px solid transparent';
  tail.style.borderRight = '6px solid transparent';
  tail.style.borderTop = `7px solid ${color}`;

  root.appendChild(pin);
  root.appendChild(tail);
  root.addEventListener('click', onClick);

  return { root, pin };
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
