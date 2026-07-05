'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { getDistanceInMeters } from '@/utils/distance';
import { SearchResultItem } from './SearchResultItem';
import type { LatLng, ParkingLot } from '@/types/parking';

interface SearchBarProps {
  parkingLots: ParkingLot[];
  userLocation: LatLng | null;
  onSelect: (lot: ParkingLot) => void;
}

/**
 * 상단 고정 검색창 + 자동완성 드롭다운.
 * 디자인 가이드 7. 검색(Search) 규격을 따릅니다: Rounded 검색창, Fade 애니메이션.
 */
export function SearchBar({ parkingLots, userLocation, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 150);

  const results = useMemo(() => {
    const keyword = debouncedQuery.trim();
    if (!keyword) return [];

    const matched = parkingLots.filter(
      (lot) => lot.name.includes(keyword) || lot.address.includes(keyword) || lot.district.includes(keyword)
    );

    if (!userLocation) return matched.slice(0, 8);

    return [...matched]
      .sort(
        (a, b) =>
          getDistanceInMeters(userLocation, { lat: a.lat, lng: a.lng }) -
          getDistanceInMeters(userLocation, { lat: b.lat, lng: b.lng })
      )
      .slice(0, 8);
  }, [debouncedQuery, parkingLots, userLocation]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (lot: ParkingLot) => {
    setQuery(lot.name);
    setIsOpen(false);
    onSelect(lot);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[highlightedIndex];
      if (target) handleSelect(target);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const showEmptyMessage = isOpen && debouncedQuery.trim().length > 0 && results.length === 0;

  return (
    <div ref={wrapperRef} className="pointer-events-auto relative w-full">
      <div className="flex h-12 items-center gap-2 rounded-full bg-white px-4 shadow-floating">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-text-secondary">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="주차장 이름을 검색하세요"
          aria-label="주차장 검색"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-text-secondary transition-colors hover:bg-gray-200"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || showEmptyMessage) && (
        <div className="animate-fade-in-up absolute left-0 right-0 top-[calc(100%+8px)] max-h-80 overflow-y-auto rounded-2xl bg-white shadow-floating">
          {results.length > 0 ? (
            <ul className="divide-y divide-divider py-1">
              {results.map((lot, index) => (
                <SearchResultItem
                  key={lot.id}
                  lot={lot}
                  distanceMeters={userLocation ? getDistanceInMeters(userLocation, { lat: lot.lat, lng: lot.lng }) : undefined}
                  isHighlighted={index === highlightedIndex}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-text-secondary">
              &lsquo;{debouncedQuery}&rsquo;에 대한 검색 결과가 없습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}
