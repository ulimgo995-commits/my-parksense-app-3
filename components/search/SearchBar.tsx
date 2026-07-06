'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { getDistanceInMeters } from '@/utils/distance';
import { SearchResultItem } from './SearchResultItem';
import { PlaceResultItem } from './PlaceResultItem';
import type { LatLng, ParkingLot, PlaceResult } from '@/types/parking';

interface SearchBarProps {
  parkingLots: ParkingLot[];
  userLocation: LatLng | null;
  onSelect: (lot: ParkingLot) => void;
  /** 제공되면 주차장 이름 검색과 함께 실제 장소/주소(카카오 Places) 검색도 활성화됩니다. */
  onSelectPlace?: (place: PlaceResult) => void;
  placeholder?: string;
}

const MAX_LOT_RESULTS = 5;
const MAX_PLACE_RESULTS = 5;

/**
 * 상단 고정 검색창 + 자동완성 드롭다운.
 * 로컬 주차장 이름/주소 매칭에 더해, onSelectPlace가 주어지면 카카오 Places
 * 키워드 검색(실제 장소/주소)도 함께 보여줍니다 (SDK는 이미 libraries=services로 로드됨).
 */
export function SearchBar({ parkingLots, userLocation, onSelect, onSelectPlace, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const latestQueryRef = useRef('');
  const debouncedQuery = useDebounce(query, 150);

  const lotResults = useMemo(() => {
    const keyword = debouncedQuery.trim();
    if (!keyword) return [];

    const matched = parkingLots.filter(
      (lot) => lot.name.includes(keyword) || lot.address.includes(keyword) || lot.district.includes(keyword)
    );

    if (!userLocation) return matched.slice(0, MAX_LOT_RESULTS);

    return [...matched]
      .sort(
        (a, b) =>
          getDistanceInMeters(userLocation, { lat: a.lat, lng: a.lng }) -
          getDistanceInMeters(userLocation, { lat: b.lat, lng: b.lng })
      )
      .slice(0, MAX_LOT_RESULTS);
  }, [debouncedQuery, parkingLots, userLocation]);

  useEffect(() => {
    const keyword = debouncedQuery.trim();
    latestQueryRef.current = keyword;

    if (!onSelectPlace || !keyword || typeof window === 'undefined' || !window.kakao?.maps?.services) {
      setPlaceResults([]);
      return;
    }

    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(keyword, (result, status) => {
      // 응답이 도착했을 때 검색어가 이미 바뀌었다면(늦게 도착한 응답) 무시합니다.
      if (latestQueryRef.current !== keyword) return;
      if (status !== window.kakao.maps.services.Status.OK) {
        setPlaceResults([]);
        return;
      }
      setPlaceResults(
        result.slice(0, MAX_PLACE_RESULTS).map((item) => ({
          id: item.id,
          name: item.place_name,
          address: item.road_address_name || item.address_name,
          lat: Number(item.y),
          lng: Number(item.x),
        }))
      );
    });
  }, [debouncedQuery, onSelectPlace]);

  const visiblePlaceResults = onSelectPlace ? placeResults : [];
  const totalResultCount = lotResults.length + visiblePlaceResults.length;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [totalResultCount]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectLot = (lot: ParkingLot) => {
    setQuery(lot.name);
    setIsOpen(false);
    onSelect(lot);
  };

  const handleSelectPlace = (place: PlaceResult) => {
    setQuery(place.name);
    setIsOpen(false);
    onSelectPlace?.(place);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || totalResultCount === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalResultCount);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalResultCount) % totalResultCount);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex < lotResults.length) {
        const target = lotResults[highlightedIndex];
        if (target) handleSelectLot(target);
      } else {
        const target = visiblePlaceResults[highlightedIndex - lotResults.length];
        if (target) handleSelectPlace(target);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const showEmptyMessage = isOpen && debouncedQuery.trim().length > 0 && totalResultCount === 0;

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
          placeholder={placeholder ?? (onSelectPlace ? '주차장, 장소, 주소를 검색하세요' : '주차장 이름을 검색하세요')}
          aria-label="주차장/장소 검색"
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

      {isOpen && (totalResultCount > 0 || showEmptyMessage) && (
        <div className="animate-fade-in-up absolute left-0 right-0 top-[calc(100%+8px)] max-h-96 overflow-y-auto rounded-2xl bg-white shadow-floating">
          {totalResultCount > 0 ? (
            <ul className="divide-y divide-divider py-1">
              {lotResults.length > 0 && onSelectPlace && (
                <li className="px-4 pb-1 pt-2 text-[11px] font-semibold text-text-secondary">주차장</li>
              )}
              {lotResults.map((lot, index) => (
                <SearchResultItem
                  key={`lot-${lot.id}`}
                  lot={lot}
                  distanceMeters={
                    userLocation ? getDistanceInMeters(userLocation, { lat: lot.lat, lng: lot.lng }) : undefined
                  }
                  isHighlighted={index === highlightedIndex}
                  onSelect={handleSelectLot}
                />
              ))}
              {visiblePlaceResults.length > 0 && (
                <li className="px-4 pb-1 pt-2 text-[11px] font-semibold text-text-secondary">장소</li>
              )}
              {visiblePlaceResults.map((place, index) => (
                <PlaceResultItem
                  key={`place-${place.id}`}
                  place={place}
                  isHighlighted={lotResults.length + index === highlightedIndex}
                  onSelect={handleSelectPlace}
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
