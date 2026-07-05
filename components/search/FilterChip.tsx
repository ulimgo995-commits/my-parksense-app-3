'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/common/icons';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  children: (close: () => void) => ReactNode;
}

/** 검색창 아래 필터 행에 쓰는 드롭다운 칩 (실시간 주차 가능/요금/운영시간/주차 유형 공용) */
export function FilterChip({ label, isActive, children }: FilterChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-9 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-xs font-medium shadow-card transition-colors ${
          isActive
            ? 'border-primary bg-primary-light text-primary'
            : 'border-divider bg-white text-text-primary hover:bg-gray-50'
        }`}
      >
        {label}
        <ChevronDownIcon className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="animate-fade-in-up absolute left-0 top-[calc(100%+8px)] z-20 rounded-xl bg-white p-1.5 shadow-floating">
          {children(() => setIsOpen(false))}
        </div>
      )}
    </div>
  );
}
