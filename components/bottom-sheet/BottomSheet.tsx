'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { CloseIcon } from '@/components/common/icons';
import { logNavigationEvent } from '@/lib/supabase/navigationEvents';
import { getKakaoDirectionsUrl } from '@/utils/kakaoLink';
import type { LatLng, ParkingLot } from '@/types/parking';
import { ParkingDetails } from './ParkingDetails';

interface BottomSheetProps {
  lot: ParkingLot | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (lot: ParkingLot) => void;
  /**
   * 데스크톱 카드가 실제로 렌더링된 높이(px)가 바뀔 때마다 알려줍니다. 카드 높이는
   * `max-h-[55vh]`일 뿐 내용에 따라 그보다 훨씬 작을 수 있어서, 이 위에 떠 있는
   * 다른 요소(혼잡도 범례 등)를 "카드 바로 위"에 붙이려면 실제 높이를 알아야 합니다.
   */
  onDesktopHeightChange?: (heightPx: number) => void;
  /** 제공되면 상세 카드에 "내 위치에서 약 N분" 예상 이동 시간이 표시됩니다. */
  userLocation?: LatLng | null;
}

const SHEET_HEIGHT_VH = 88;
const COLLAPSED_VISIBLE_VH = 42;
const EXPANDED_TRANSLATE_VH = 0;
const COLLAPSED_TRANSLATE_VH = SHEET_HEIGHT_VH - COLLAPSED_VISIBLE_VH;

/**
 * 주차장 상세 정보 표시 컨테이너.
 * - Mobile(<md): 드래그 가능한 Bottom Sheet (Collapsed 42% / Expanded 88%)
 * - Desktop(>=md): 지도 영역 하단에서 위로 올라오는 카드형 패널.
 *   (지도를 감싸는 부모가 `relative`이므로 이 컴포넌트는 `absolute`로 그 영역 안에서만 움직입니다.)
 *
 * 즐겨찾기 상태는 상위 페이지 컴포넌트에서 단일 useFavorites 인스턴스로 관리하여
 * Bottom Sheet / 내 주변 / 즐겨찾기 화면 간 상태가 항상 일치하도록 합니다.
 */
export function BottomSheet({ lot, onClose, isFavorite, onToggleFavorite, onDesktopHeightChange, userLocation }: BottomSheetProps) {
  const isDesktop = useIsDesktop();
  const isOpen = lot !== null;
  const [displayedLot, setDisplayedLot] = useState<ParkingLot | null>(lot);
  const { snap, setSnap, isDragging, dragOffset, dragHandlers } = useBottomSheet({ isOpen, onClose });
  const desktopPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lot) setDisplayedLot(lot);
  }, [lot]);

  useEffect(() => {
    if (isOpen) setSnap('collapsed');
  }, [lot?.id, isOpen, setSnap]);

  // 카드 내용(주차장이 바뀌거나 접기/펼치기)에 따라 실제 렌더링 높이가 계속 바뀌므로
  // ResizeObserver로 매번 최신 값을 상위에 전달합니다. 닫혀 있을 때는 0으로 알립니다.
  useLayoutEffect(() => {
    if (!onDesktopHeightChange) return;
    if (!isDesktop || !isOpen) {
      onDesktopHeightChange(0);
      return;
    }
    const node = desktopPanelRef.current;
    if (!node) return;
    const report = () => onDesktopHeightChange(node.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isDesktop, isOpen, displayedLot, onDesktopHeightChange]);

  if (!displayedLot) return null;

  const handleNavigate = () => {
    // 팝업 차단을 피하려면 window.open은 클릭 핸들러 안에서 동기적으로 먼저 호출해야 합니다.
    window.open(getKakaoDirectionsUrl(displayedLot), '_blank', 'noopener,noreferrer');
    // 로그 기록은 화면 이동을 막지 않도록 결과를 기다리지 않습니다 (실패해도 내부에서 처리됨).
    void logNavigationEvent(displayedLot.id);
  };

  if (isDesktop) {
    return (
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-40 flex justify-center">
        <div
          ref={desktopPanelRef}
          className={`max-h-[55vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-floating transition-transform duration-300 ease-out ${
            isOpen ? 'pointer-events-auto translate-y-0' : 'pointer-events-none translate-y-[120%]'
          }`}
        >
          <div className="flex justify-end px-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-gray-100"
            >
              <CloseIcon />
            </button>
          </div>
          <ParkingDetails
            lot={displayedLot}
            isFavorite={isFavorite}
            onToggleFavorite={() => onToggleFavorite(displayedLot)}
            onNavigate={handleNavigate}
            userLocation={userLocation}
          />
        </div>
      </div>
    );
  }

  const translateVh = isOpen ? (snap === 'expanded' ? EXPANDED_TRANSLATE_VH : COLLAPSED_TRANSLATE_VH) : 120;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-sheet bg-white shadow-sheet"
      style={{
        height: `${SHEET_HEIGHT_VH}vh`,
        transform: `translateY(calc(${translateVh}vh + ${dragOffset}px))`,
        transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}
      role="dialog"
      aria-label={`${displayedLot.name} 상세 정보`}
    >
      <div
        {...dragHandlers}
        className="flex shrink-0 touch-none flex-col items-center gap-2 pb-1 pt-3 cursor-grab active:cursor-grabbing"
        onDoubleClick={() => setSnap(snap === 'expanded' ? 'collapsed' : 'expanded')}
      >
        <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-gray-100"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <ParkingDetails
          lot={displayedLot}
          isFavorite={isFavorite}
          onToggleFavorite={() => onToggleFavorite(displayedLot)}
          onNavigate={handleNavigate}
          onShowDetails={snap === 'collapsed' ? () => setSnap('expanded') : undefined}
          userLocation={userLocation}
        />
      </div>
    </div>
  );
}
