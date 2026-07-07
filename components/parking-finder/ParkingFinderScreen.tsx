'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KakaoMap, DAEJEON_CITY_HALL, type KakaoMapHandle } from '@/components/map/KakaoMap';
import { CurrentLocationButton } from '@/components/map/CurrentLocationButton';
import { CongestionLegend } from '@/components/map/CongestionLegend';
import { SearchAreaButton } from '@/components/map/SearchAreaButton';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterBar } from '@/components/search/FilterBar';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { LocationPermissionBanner } from '@/components/permission/LocationPermissionBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { ParkingListItem } from '@/components/common/ParkingListItem';
import { GridIcon, ParkingPinIcon } from '@/components/common/icons';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useParkingFilters } from '@/hooks/useParkingFilters';
import { useFavorites } from '@/hooks/useFavorites';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { getDistanceInMeters } from '@/utils/distance';
import type { LatLng, ParkingLot, PlaceResult } from '@/types/parking';

/** 데스크톱 하단에서 올라오는 상세 카드에 선택한 마커가 가려지지 않도록 지도 중심을 위로 미는 픽셀 값 */
const DESKTOP_PANEL_OFFSET_PX = 160;
/** 검색 결과 목록에 포함할 최대 반경(내 실시간 위치 기준) */
const NEARBY_RADIUS_METERS = 5000;

type SortMode = 'recommended' | 'distance';
type MobileView = 'map' | 'list';

/**
 * 추천순 점수 = 거리 점수(가까울수록 1에 가까움, 반경 밖이면 0) * 0.5
 *            + 여유 점수(가능면수 비율이 높을수록 1에 가까움) * 0.5
 * 위치 정보가 없으면 거리 점수 없이 여유 점수만으로 정렬합니다.
 */
function getRecommendationScore(lot: ParkingLot, userLocation: LatLng | null): number {
  const availabilityScore = lot.totalSpaces > 0 ? lot.availableSpaces / lot.totalSpaces : 0;
  if (!userLocation) return availabilityScore;

  const distanceMeters = getDistanceInMeters(userLocation, { lat: lot.lat, lng: lot.lng });
  const distanceScore = Math.max(0, 1 - distanceMeters / NEARBY_RADIUS_METERS);
  return distanceScore * 0.5 + availabilityScore * 0.5;
}

/**
 * "주차장 찾기" 화면 — 검색/필터/지도/상세 카드에 더해, 예전 "내 주변" 탭의
 * 거리순 목록 기능을 왼쪽 사이드바(데스크톱)/목록 보기 토글(모바일)로 통합했습니다.
 * 홈 화면에서 ?lot=<id> 또는 ?lat=&lng= 쿼리로 들어오면 해당 주차장/좌표로 자동 이동합니다.
 */
export function ParkingFinderScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { parkingLots, status: lotsStatus, error: lotsError, refetch } = useParkingLots();
  const { position: userLocation, status: geoStatus, errorReason, requestLocation } = useGeolocation();
  const parkingFilters = useParkingFilters(parkingLots);
  const { filteredLots } = parkingFilters;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const isDesktop = useIsDesktop();

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [mobileView, setMobileView] = useState<MobileView>('map');
  const mapRef = useRef<KakaoMapHandle>(null);
  const didHandleQueryRef = useRef(false);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 최초 위치로 지도를 자동 중심 이동시키는 로직은 KakaoMap 내부(선택된 주차장이 있으면
  // 건드리지 않음)에서 처리합니다. 여기서 별도로 처리하면, 위치 정확도가 나중에 개선되며
  // userLocation이 다시 바뀔 때마다 이미 선택해서 보고 있는 주차장을 무시하고 지도가
  // 엉뚱하게 다시 움직이는 문제가 있었습니다.

  useEffect(() => {
    if (geoStatus === 'error') setIsBannerDismissed(false);
  }, [geoStatus, errorReason]);

  const selectedLot = parkingLots.find((lot) => lot.id === selectedLotId) ?? null;
  const visibleLots = useMemo(
    () => (favoritesOnly ? filteredLots.filter((lot) => isFavorite(lot.id)) : filteredLots),
    [filteredLots, favoritesOnly, isFavorite]
  );
  // 검색 결과 목록은 내 실시간 위치 기준 반경 5km 이내로 제한합니다 (위치를 아직 모르면 전체 표시).
  const nearbyLots = useMemo(() => {
    if (!userLocation) return visibleLots;
    return visibleLots.filter(
      (lot) => getDistanceInMeters(userLocation, { lat: lot.lat, lng: lot.lng }) <= NEARBY_RADIUS_METERS
    );
  }, [visibleLots, userLocation]);
  const sortedSidebarLots = useMemo(() => {
    if (sortMode === 'distance') {
      if (!userLocation) return nearbyLots;
      return [...nearbyLots].sort(
        (a, b) =>
          getDistanceInMeters(userLocation, { lat: a.lat, lng: a.lng }) -
          getDistanceInMeters(userLocation, { lat: b.lat, lng: b.lng })
      );
    }
    return [...nearbyLots].sort(
      (a, b) => getRecommendationScore(b, userLocation) - getRecommendationScore(a, userLocation)
    );
  }, [nearbyLots, sortMode, userLocation]);
  const isSheetOpen = selectedLotId !== null;

  const handleSelectLot = useCallback(
    (lot: ParkingLot) => {
      setSelectedLotId(lot.id);
      setShowSearchAreaButton(false);
      setMobileView('map');
      mapRef.current?.panTo({ lat: lot.lat, lng: lot.lng }, 4);
      if (isDesktop) {
        mapRef.current?.panByPixels(0, DESKTOP_PANEL_OFFSET_PX);
      }
    },
    [isDesktop]
  );

  const handleSelectPlace = useCallback((place: PlaceResult) => {
    setSelectedLotId(null);
    setShowSearchAreaButton(false);
    setMobileView('map');
    mapRef.current?.panTo({ lat: place.lat, lng: place.lng }, 5);
    mapRef.current?.refreshVisibleArea();
  }, []);

  // 홈 화면에서 넘어온 쿼리 파라미터(?lot=<id> 또는 ?lat=&lng=)를 데이터 로드 완료 후 1회 처리합니다.
  useEffect(() => {
    if (didHandleQueryRef.current || lotsStatus !== 'success') return;
    const lotId = searchParams.get('lot');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (lotId) {
      const target = parkingLots.find((lot) => lot.id === lotId);
      if (target) {
        didHandleQueryRef.current = true;
        handleSelectLot(target);
      }
    } else if (lat && lng) {
      didHandleQueryRef.current = true;
      handleSelectPlace({ id: 'query', name: '', address: '', lat: Number(lat), lng: Number(lng) });
    }
  }, [lotsStatus, parkingLots, searchParams, handleSelectLot, handleSelectPlace]);

  const handleCloseSheet = useCallback(() => {
    setSelectedLotId(null);
    router.replace('/parking');
    if (isDesktop) {
      mapRef.current?.panByPixels(0, -DESKTOP_PANEL_OFFSET_PX);
    }
  }, [isDesktop, router]);

  const handleCurrentLocationClick = useCallback(() => {
    if (userLocation) {
      mapRef.current?.panTo(userLocation, 5);
      if (isDesktop && isSheetOpen) {
        mapRef.current?.panByPixels(0, DESKTOP_PANEL_OFFSET_PX);
      }
    }
    requestLocation();
  }, [requestLocation, userLocation, isDesktop, isSheetOpen]);

  const handleToggleFavorite = useCallback(
    async (lot: ParkingLot) => {
      try {
        const nowFavorite = await toggleFavorite(lot.id);
        showToast(
          nowFavorite ? `${lot.name}을(를) 즐겨찾기에 추가했어요` : '즐겨찾기에서 제거했어요',
          nowFavorite ? 'success' : 'default'
        );
      } catch (err) {
        console.warn('[ParkingFinderScreen] 즐겨찾기 처리 실패:', err);
        showToast('즐겨찾기 처리에 실패했어요. 잠시 후 다시 시도해주세요.', 'error');
      }
    },
    [toggleFavorite, showToast]
  );

  const handleSearchThisArea = useCallback(() => {
    const visibleIds = mapRef.current?.getVisibleLotIds() ?? [];
    const visibleCount = visibleLots.filter((lot) => visibleIds.includes(lot.id)).length;
    mapRef.current?.refreshVisibleArea();
    setShowSearchAreaButton(false);
    showToast(
      visibleCount > 0 ? `이 지역에 주차장 ${visibleCount}곳이 있어요` : '이 지역에는 표시할 주차장이 없어요'
    );
  }, [visibleLots, showToast]);

  const showPermissionBanner = geoStatus === 'error' && !isBannerDismissed;
  // 데스크톱은 하단에서 올라오는 상세 카드(최대 55vh)에 가려지지 않도록 두 버튼을 카드 위로 밀어 올립니다.
  const locationButtonBottomClass = isSheetOpen
    ? 'bottom-[calc(42vh+16px)] md:bottom-[calc(55vh+16px)]'
    : 'bottom-24 md:bottom-6';
  const legendBottomClass = isSheetOpen ? 'bottom-6 md:bottom-[calc(55vh+16px)]' : 'bottom-20';
  const showMapPane = isDesktop || mobileView === 'map';

  const sidebarList = (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-divider p-4">
        <h1 className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <ParkingPinIcon className="text-primary" />
          주차장 찾기
        </h1>
        <p className="mt-1 text-xs text-text-secondary">원하는 지역을 검색하고 실시간 주차 가능 여부를 확인하세요.</p>
      </div>
      <div className="flex items-center justify-between border-b border-divider px-4 py-2">
        <p className="text-xs font-semibold text-text-secondary">검색 결과 {sortedSidebarLots.length}개</p>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setSortMode('recommended')}
            className={`rounded-full px-3 py-1 font-semibold transition-colors ${
              sortMode === 'recommended' ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-100'
            }`}
          >
            추천순
          </button>
          <button
            type="button"
            onClick={() => setSortMode('distance')}
            disabled={!userLocation}
            className={`rounded-full px-3 py-1 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              sortMode === 'distance' ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-100'
            }`}
          >
            거리순
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        {sortedSidebarLots.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="조건에 맞는 주차장이 없어요"
            description={
              favoritesOnly
                ? '즐겨찾기한 주차장이 없어요.'
                : userLocation && nearbyLots.length === 0
                  ? '반경 5km 이내에 등록된 주차장이 없어요.'
                  : '필터 조건을 조정해보세요.'
            }
            className="pt-16"
          />
        ) : (
          <ul>
            {sortedSidebarLots.map((lot) => (
              <ParkingListItem
                key={lot.id}
                lot={lot}
                distanceMeters={
                  userLocation ? getDistanceInMeters(userLocation, { lat: lot.lat, lng: lot.lng }) : undefined
                }
                isFavorite={isFavorite(lot.id)}
                onSelect={handleSelectLot}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-gray-100">
      <aside className="hidden h-full shrink-0 border-r border-divider md:block md:w-[380px]">{sidebarList}</aside>

      <div className={`relative h-full flex-1 ${showMapPane ? 'block' : 'hidden'} md:block`}>
        <KakaoMap
          ref={mapRef}
          parkingLots={visibleLots}
          selectedLotId={selectedLotId}
          userLocation={userLocation}
          onSelectLot={handleSelectLot}
          onViewportChange={() => setShowSearchAreaButton(true)}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center gap-2 p-4">
          <div className="pointer-events-auto w-full max-w-xl">
            {lotsStatus === 'loading' ? (
              <Skeleton className="h-12 rounded-full" />
            ) : (
              <SearchBar
                parkingLots={visibleLots}
                userLocation={userLocation ?? DAEJEON_CITY_HALL}
                onSelect={handleSelectLot}
                onSelectPlace={handleSelectPlace}
                placeholder="목적지나 주소를 입력하세요"
              />
            )}
          </div>
          {lotsStatus !== 'loading' && (
            <div className="pointer-events-auto w-full max-w-xl">
              <FilterBar
                {...parkingFilters}
                favoritesOnly={favoritesOnly}
                onToggleFavoritesOnly={() => setFavoritesOnly((prev) => !prev)}
              />
            </div>
          )}
          {showPermissionBanner && errorReason && (
            <div className="pointer-events-auto w-full max-w-xl">
              <LocationPermissionBanner reason={errorReason} onRetry={requestLocation} onDismiss={() => setIsBannerDismissed(true)} />
            </div>
          )}
          {showSearchAreaButton && (
            <div className="pointer-events-auto">
              <SearchAreaButton onClick={handleSearchThisArea} />
            </div>
          )}
        </div>

        <div
          className={`pointer-events-none absolute left-6 z-30 hidden transition-[bottom] duration-300 md:block ${legendBottomClass}`}
        >
          <CongestionLegend />
        </div>

        <CurrentLocationButton
          onClick={handleCurrentLocationClick}
          isLoading={geoStatus === 'loading'}
          className={`pointer-events-auto absolute right-4 z-30 transition-[bottom] duration-300 md:right-6 ${locationButtonBottomClass}`}
        />

        {/* 모바일 전용: 목록/지도 전환 버튼 (예전 "내 주변" 탭 기능을 이 화면에 통합) */}
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className="pointer-events-auto absolute bottom-24 left-4 z-30 flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-text-primary shadow-floating md:hidden"
        >
          <GridIcon size={16} />
          목록 보기
        </button>

        <BottomSheet lot={selectedLot} onClose={handleCloseSheet} isFavorite={selectedLot ? isFavorite(selectedLot.id) : false} onToggleFavorite={handleToggleFavorite} />

        {lotsStatus === 'error' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <EmptyState
              icon="⚠️"
              title="주차장 정보를 불러오지 못했어요"
              description={lotsError ?? undefined}
              action={
                <Button variant="primary" onClick={refetch} className="mt-2">
                  다시 시도
                </Button>
              }
            />
          </div>
        )}

        {lotsStatus === 'success' && parkingLots.length === 0 && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <EmptyState icon="🅿️" title="표시할 주차장이 없어요" description="잠시 후 다시 확인해주세요." />
          </div>
        )}
      </div>

      {/* 모바일에서 "목록 보기" 선택 시 지도 대신 전체 목록을 보여줍니다 (예전 "내 주변" 탭 기능 통합). */}
      {!isDesktop && mobileView === 'list' && (
        <div className="absolute inset-0 z-40 bg-white">
          {sidebarList}
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className="absolute bottom-6 left-1/2 z-50 flex h-11 -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-floating"
          >
            <ParkingPinIcon size={16} />
            지도 보기
          </button>
        </div>
      )}
    </div>
  );
}
