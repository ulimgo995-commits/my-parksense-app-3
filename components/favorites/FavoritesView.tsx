'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KakaoMap, type KakaoMapHandle } from '@/components/map/KakaoMap';
import { CurrentLocationButton } from '@/components/map/CurrentLocationButton';
import { CongestionLegend } from '@/components/map/CongestionLegend';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { EmptyState } from '@/components/common/EmptyState';
import { ParkingListItem } from '@/components/common/ParkingListItem';
import { Spinner } from '@/components/common/Spinner';
import { BellIcon, GridIcon, InfoIcon, StarIcon } from '@/components/common/icons';
import { CONGESTION_LEVELS, getCongestionLevel, getCongestionMetaByLevel } from '@/lib/parking/congestion';
import { useFavorites } from '@/hooks/useFavorites';
import { useSharedGeolocation } from '@/components/common/GeolocationProvider';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useToast } from '@/hooks/useToast';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { getDistanceInMeters } from '@/utils/distance';
import type { CongestionLevel, ParkingLot } from '@/types/parking';

type SortMode = 'default' | 'recent' | 'added';
type ViewMode = 'map' | 'list';

const LAST_VIEWED_STORAGE_KEY = 'parkflow:favorites:last-viewed';

/** "최근 이용순" 정렬을 위해, 즐겨찾기 목록에서 실제로 선택(조회)한 시각을 기기에 저장합니다. */
function readLastViewedMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LAST_VIEWED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * "즐겨찾기" 화면 — 저장한 주차장을 검색/필터/지도/상세 카드와 함께 보여줍니다.
 * ParkingFinderScreen과 동일한 지도·바텀시트 인프라를 재사용하되, 검색창 대신
 * 즐겨찾기 전용 정렬 탭·혼잡도 필터·편집 모드를 제공합니다.
 */
export function FavoritesView() {
  const { parkingLots } = useParkingLots();
  const { addedAtById, isFavorite, toggleFavorite, isLoaded } = useFavorites();
  const { position: userLocation, tentativePosition, status: geoStatus, requestLocation } = useSharedGeolocation();
  const { showToast } = useToast();
  const isDesktop = useIsDesktop();

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [congestionFilter, setCongestionFilter] = useState<CongestionLevel | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [lastViewedById, setLastViewedById] = useState<Record<string, string>>({});
  const mapRef = useRef<KakaoMapHandle>(null);

  // 위치 조회 자체는 app/layout.tsx의 GeolocationProvider가 앱 전체에서 한 번만 트리거합니다.
  useEffect(() => {
    setLastViewedById(readLastViewedMap());
  }, []);

  const favoriteLots = useMemo(() => parkingLots.filter((lot) => isFavorite(lot.id)), [parkingLots, isFavorite]);
  const congestionFilteredLots = useMemo(() => {
    if (congestionFilter === 'all') return favoriteLots;
    return favoriteLots.filter((lot) => getCongestionLevel(lot.totalSpaces, lot.availableSpaces) === congestionFilter);
  }, [favoriteLots, congestionFilter]);

  const sortedLots = useMemo(() => {
    if (sortMode === 'added') {
      // 내가 추가한 순 = 즐겨찾기에 추가한 시각이 오래된 순서대로.
      return [...congestionFilteredLots].sort(
        (a, b) => new Date(addedAtById[a.id] ?? 0).getTime() - new Date(addedAtById[b.id] ?? 0).getTime()
      );
    }
    if (sortMode === 'recent') {
      // 최근 이용순 = 이 화면에서 실제로 선택(조회)한 시각이 최신인 순서대로. 조회 기록이 없으면 맨 뒤로 보냅니다.
      return [...congestionFilteredLots].sort(
        (a, b) => new Date(lastViewedById[b.id] ?? 0).getTime() - new Date(lastViewedById[a.id] ?? 0).getTime()
      );
    }
    // 전체(기본) = 즐겨찾기에 추가한 시각이 최신인 순서대로.
    return [...congestionFilteredLots].sort(
      (a, b) => new Date(addedAtById[b.id] ?? 0).getTime() - new Date(addedAtById[a.id] ?? 0).getTime()
    );
  }, [congestionFilteredLots, sortMode, addedAtById, lastViewedById]);

  const selectedLot = favoriteLots.find((lot) => lot.id === selectedLotId) ?? null;

  const handleSelectLot = useCallback((lot: ParkingLot) => {
    setSelectedLotId(lot.id);
    setViewMode('map');
    mapRef.current?.panTo({ lat: lot.lat, lng: lot.lng }, 4);
    setLastViewedById((prev) => {
      const next = { ...prev, [lot.id]: new Date().toISOString() };
      try {
        window.localStorage.setItem(LAST_VIEWED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage를 쓸 수 없는 환경(프라이빗 모드 등)이면 이번 세션에서만 정렬에 반영됩니다.
      }
      return next;
    });
  }, []);

  const handleCloseSheet = useCallback(() => setSelectedLotId(null), []);

  const handleCurrentLocationClick = useCallback(() => {
    if (userLocation) mapRef.current?.panTo(userLocation, 5);
    requestLocation();
  }, [requestLocation, userLocation]);

  const handleToggleFavorite = useCallback(
    async (lot: ParkingLot) => {
      try {
        const nowFavorite = await toggleFavorite(lot.id);
        if (!nowFavorite && selectedLotId === lot.id) setSelectedLotId(null);
        showToast(
          nowFavorite ? `${lot.name}을(를) 즐겨찾기에 추가했어요` : '즐겨찾기에서 제거했어요',
          nowFavorite ? 'success' : 'default'
        );
      } catch (err) {
        console.warn('[FavoritesView] 즐겨찾기 처리 실패:', err);
        showToast('즐겨찾기 처리에 실패했어요. 잠시 후 다시 시도해주세요.', 'error');
      }
    },
    [toggleFavorite, showToast, selectedLotId]
  );

  const sidebarList = (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-divider p-4">
        <h1 className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <span className="text-primary">
            <StarIcon size={20} />
          </span>
          즐겨찾기
        </h1>
        <p className="mt-1 text-xs text-text-secondary">자주 이용하는 주차장을 저장하고 빠르게 확인하세요.</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setSortMode('default')}
              className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
                sortMode === 'default' ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-100'
              }`}
            >
              전체 ({favoriteLots.length})
            </button>
            <button
              type="button"
              onClick={() => setSortMode('recent')}
              className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
                sortMode === 'recent' ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-100'
              }`}
            >
              최근 이용순
            </button>
            <button
              type="button"
              onClick={() => setSortMode('added')}
              className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
                sortMode === 'added' ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-100'
              }`}
            >
              내가 추가한 순
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              isEditing ? 'border-primary bg-primary text-white' : 'border-divider text-text-primary hover:bg-gray-50'
            }`}
          >
            {isEditing ? '완료' : '편집'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {!isLoaded ? (
          <div className="flex justify-center pt-16">
            <Spinner />
          </div>
        ) : sortedLots.length === 0 ? (
          <EmptyState
            icon="⭐"
            title={favoriteLots.length === 0 ? '아직 즐겨찾기에 추가한 주차장이 없어요' : '조건에 맞는 주차장이 없어요'}
            description={
              favoriteLots.length === 0
                ? '주차장 찾기에서 별 아이콘을 눌러 즐겨찾기에 추가해보세요.'
                : '혼잡도 필터를 조정해보세요.'
            }
            className="pt-16"
          />
        ) : (
          <ul>
            {sortedLots.map((lot) => (
              <ParkingListItem
                key={lot.id}
                lot={lot}
                distanceMeters={
                  userLocation ? getDistanceInMeters(userLocation, { lat: lot.lat, lng: lot.lng }) : undefined
                }
                isFavorite
                showRemoveIcon={isEditing}
                onSelect={handleSelectLot}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-divider p-4">
        <a
          href="/parking"
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
        >
          + 주차장 추가하기
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gray-100">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden h-full shrink-0 border-r border-divider md:block md:w-[380px]">{sidebarList}</aside>

        <div className={`relative h-full flex-1 ${viewMode === 'map' ? 'block' : 'hidden'} md:block`}>
          <KakaoMap
            ref={mapRef}
            parkingLots={congestionFilteredLots}
            selectedLotId={selectedLotId}
            userLocation={userLocation}
            tentativeUserLocation={tentativePosition}
            onSelectLot={handleSelectLot}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-4">
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white p-1 shadow-floating">
              {(['all', ...CONGESTION_LEVELS] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setCongestionFilter(level)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    congestionFilter === level
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-gray-100'
                  }`}
                >
                  {level === 'all' ? '전체' : getCongestionMetaByLevel(level).label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'map' ? 'list' : 'map'))}
              className="pointer-events-auto flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 text-xs font-semibold text-text-primary shadow-floating transition-colors hover:bg-gray-50 md:hidden"
            >
              <GridIcon size={14} />
              {viewMode === 'map' ? '목록으로 보기' : '지도로 보기'}
            </button>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-20 z-30 hidden justify-center md:flex">
            <CongestionLegend variant="bar" />
          </div>

          <CurrentLocationButton
            onClick={handleCurrentLocationClick}
            isLoading={geoStatus === 'loading'}
            className="pointer-events-auto absolute bottom-24 right-4 z-30 md:bottom-6 md:right-6"
          />

          <BottomSheet
            lot={selectedLot}
            onClose={handleCloseSheet}
            isFavorite={selectedLot ? isFavorite(selectedLot.id) : false}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>

        {/* 모바일에서 "목록으로 보기" 선택 시 지도 대신 전체 목록을 보여줍니다. */}
        {!isDesktop && viewMode === 'list' && <div className="absolute inset-0 z-40 bg-white">{sidebarList}</div>}
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 border-t border-divider bg-white p-4 md:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-primary">
            <StarIcon size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-text-primary">즐겨찾기 사용 팁</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              자주 이용하는 주차장을 즐겨찾기에 추가하면 더 빠르게 확인할 수 있어요.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-primary">
            <BellIcon size={18} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-text-primary">실시간 알림 설정</p>
            <p className="mt-0.5 text-xs text-text-secondary">즐겨찾기한 주차장의 혼잡도 변화를 알림으로 받아보세요.</p>
            <button
              type="button"
              onClick={() => showToast('알림 설정은 아직 준비 중인 기능이에요.')}
              className="mt-2 rounded-full border border-divider px-3 py-1 text-xs font-semibold text-text-primary transition-colors hover:bg-gray-100"
            >
              알림 설정
            </button>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-primary">
            <InfoIcon size={18} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-text-primary">문의 및 도움말</p>
            <p className="mt-0.5 text-xs text-text-secondary">서비스 이용 중 문제가 있으신가요? 고객센터로 문의해주세요.</p>
            <a
              href="https://github.com/ulimgo995-commits/parksense/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-full border border-divider px-3 py-1 text-xs font-semibold text-text-primary transition-colors hover:bg-gray-100"
            >
              고객센터
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
