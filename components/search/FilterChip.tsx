'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/common/icons';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  children: (close: () => void) => ReactNode;
}

interface DropdownPosition {
  top: number;
  left: number;
}

/**
 * 검색창 아래 필터 행에 쓰는 드롭다운 칩.
 *
 * 필터 행은 칩이 많아지면 가로 스크롤(overflow-x-auto)되는데, CSS 스펙상 overflow-x를
 * visible이 아닌 값으로 지정하면 overflow-y도 자동으로 visible이 아닌 값(auto)으로
 * 계산되어 버립니다. 그 결과 드롭다운이 칩 아래로 열려도 부모 스크롤 영역에 잘려
 * "드롭다운이 안 열리는 것처럼" 보이는 문제가 있었습니다.
 * 이를 피하기 위해 드롭다운 내용을 document.body에 포탈로 렌더링합니다.
 */
export function FilterChip({ label, isActive, children }: FilterChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const close = () => setIsOpen(false);

  const handleToggle = () => {
    if (isOpen) {
      close();
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ top: rect.bottom + 8, left: rect.left });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      close();
    }

    // 스크롤/리사이즈 중에는 위치가 어긋날 수 있으므로 안전하게 닫습니다.
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-xs font-medium shadow-card transition-colors ${
          isActive
            ? 'border-primary bg-primary-light text-primary'
            : 'border-divider bg-white text-text-primary hover:bg-gray-50'
        }`}
      >
        {label}
        <ChevronDownIcon className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: position.top, left: position.left }}
            className="animate-fade-in-up z-[70] rounded-xl bg-white p-1.5 shadow-floating"
          >
            {children(close)}
          </div>,
          document.body
        )}
    </>
  );
}
