'use client';

import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

export type SheetSnap = 'collapsed' | 'expanded';

interface UseBottomSheetOptions {
  isOpen: boolean;
  onClose: () => void;
}

interface UseBottomSheetResult {
  snap: SheetSnap;
  setSnap: (snap: SheetSnap) => void;
  isDragging: boolean;
  /** 드래그 중 임시로 적용할 translateY(px). 드래그가 끝나면 0으로 복귀합니다. */
  dragOffset: number;
  dragHandlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  };
}

/** 아래로 끌어서 닫기 판단 임계값(px) */
const DISMISS_THRESHOLD = 120;
/** collapsed <-> expanded 전환 임계값(px) */
const SNAP_THRESHOLD = 60;

/**
 * 모바일 Bottom Sheet의 드래그 제스처(collapsed/expanded 스냅, 아래로 끌어서 닫기)를
 * 관리하는 훅. 실제 높이 계산은 컴포넌트의 CSS(Tailwind 클래스)에 위임하고,
 * 이 훅은 순수하게 제스처 방향/거리만 계산합니다.
 */
export function useBottomSheet({ isOpen, onClose }: UseBottomSheetOptions): UseBottomSheetResult {
  const [snap, setSnap] = useState<SheetSnap>('collapsed');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef<number | null>(null);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isOpen) return;
      startYRef.current = event.clientY;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isOpen]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (startYRef.current === null) return;
      const delta = event.clientY - startYRef.current;
      // 위로 끌어올리는 힘은 살짝 저항을 줘서 자연스러운 탄성 느낌을 준다.
      setDragOffset(delta < 0 ? delta * 0.4 : delta);
    },
    []
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (startYRef.current === null) return;
      const delta = event.clientY - startYRef.current;
      startYRef.current = null;
      setIsDragging(false);
      setDragOffset(0);

      if (snap === 'expanded') {
        if (delta > DISMISS_THRESHOLD * 1.5) {
          onClose();
        } else if (delta > SNAP_THRESHOLD) {
          setSnap('collapsed');
        }
        return;
      }

      // snap === 'collapsed'
      if (delta > DISMISS_THRESHOLD) {
        onClose();
      } else if (delta < -SNAP_THRESHOLD) {
        setSnap('expanded');
      }
    },
    [onClose, snap]
  );

  return {
    snap,
    setSnap,
    isDragging,
    dragOffset,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp },
  };
}
