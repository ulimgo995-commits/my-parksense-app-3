'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KakaoMap, SEOUL_CITY_HALL, type KakaoMapHandle } from '@/components/map/KakaoMap';
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
import { ToggleSwitch } from '@/components/common/ToggleSwitch';
import { ParkingListItem } from '@/components/common/ParkingListItem';
import { GridIcon, ParkingPinIcon, SearchIcon } from '@/components/common/icons';
import { DEFAULT_RADIUS_KM } from '@/components/search/filterOptions';
import { useSharedGeolocation } from '@/components/common/GeolocationProvider';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useParkingFilters } from '@/hooks/useParkingFilters';
import { useFavorites } from '@/hooks/useFavorites';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { getDistanceInMeters } from '@/utils/distance';
import type { LatLng, ParkingLot, PlaceResult } from '@/types/parking';

/** 데스크톱 하단에서 올라오는 상세 카드에 선택한 마커가 가려지지 않도록 지도 중심을 위로 미는 픽셀 값 */
const DESKTOP_PANEL_OFFSET_PX = 160;

type SortMode = 'recommended' | 'distance';
type MobileView = 'map' | 'list';

/**
 * 추천순 점수 = 거리 점수(가까울수록 1에 가까움, 반경 밖이면 0) * 0.5
 *            + 여유 점수(가능면수 비율이 높을수록 1에 가까움) * 0.5
 * 위치 정보가 없으면 거리 점수 없이 여유 점수만으로 정렬합니다.
 */
function getRecommendationScore(lot: ParkingLot, userLocation: LatLng | null, radiusMeters: number): number {
  const availabilityScore = lot.totalSpaces > 0 ? lot.availableSpaces / lot.totalSpaces : 0;
  if (!userLocation) return availabilityScore;

  const distanceMeters = getDistanceInMeters(userLocation, { lat: lot.lat, lng: lot.lng });
  const distanceScore = Math.max(0, 1 - distanceMeters / radiusMeters);
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
  const { position: userLocation, tentativePosition, status: geoStatus, errorReason, requestLocation } = useSharedGeolocation();
  const parkingFilters = useParkingFilters(parkingLots);
  const { filteredLots } = parkingFilters;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const isDesktop = useIsDesktop();

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  // 검색으로 이동한 목적지가 있으면 그 지점을, 없으면 내 실시간 위치를 "기준 위치"로 사용합니다.
  // 목적지 검색 시 그 지점 기준으로 반경/정렬이 계산되도록 하기 위함입니다.
  const [searchOrigin, setSearchOrigin] = useState<LatLng | null>(null);
  // 사이드바 필터 칩과 지도 위 토글이 같은 상태를 공유합니다(참고 디자인에 둘 다 있음).
  // 실제로 걸러낼 데이터가 없어 켜고 끄는 것 외의 동작은 없습니다.
  const [isRealtimeOnly, setIsRealtimeOnly] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [mobileView, setMobileView] = useState<MobileView>('map');
  // 데스크톱 하단 상세 카드의 실제 렌더링 높이(px) — 혼잡도 범례를 카드 바로 위에 붙이는 데 사용합니다.
  const [desktopSheetHeightPx, setDesktopSheetHeightPx] = useState(0);
  const mapRef = useRef<KakaoMapHandle>(null);
  const didHandleQueryRef = useRef(false);

  // 위치 조회 자체는 app/layout.tsx의 GeolocationProvider가 앱 전체에서 한 번만 트리거합니다.
  // 여기서 또 requestLocation()을 호출하면 이 페이지로 올 때마다 새로 조회하게 되어, 이미 확정된
  // (정확할 수도 있는) 값을 버리고 다시 운에 맡기게 되는 문제가 있었습니다.

  // 최초 위치로 지도를 자동 중심 이동시키는 로직은 KakaoMap 내부(선택된 주차장이 있으면
  // 건드리지 않음)에서 처리합니다. 여기서 별도로 처리하면, 위치 정확도가 나중에 개선되며
  // userLocation이 다시 바뀔 때마다 이미 선택해서 보고 있는 주차장을 무시하고 지도가
  // 엉뚱하게 다시 움직이는 문제가 있었습니다.

  useEffect(() => {
    if (geoStatus === 'error') setIsBannerDismissed(false);
  }, [geoStatus, errorReason]);

  const selectedLot = parkingLots.find((lot) => lot.id === selectedLotId) ?? null;
  // 검색으로 목적지를 선택했다면 그 지점을, 아니면 내 실시간 위치를 기준으로 반경/정렬을 계산합니다.
  const referenceLocation = searchOrigin ?? userLocation;
  const visibleLots = useMemo(
    () => (favoritesOnly ? filteredLots.filter((lot) => isFavorite(lot.id)) : filteredLots),
    [filteredLots, favoritesOnly, isFavorite]
  );
  // 검색 결과 목록은 기준 위치(referenceLocation) 반경(radiusKm, 기본 3km) 이내로 제한합니다
  // (기준 위치를 아직 모르면 전체 표시).
  const nearbyLots = useMemo(() => {
    if (!referenceLocation) return visibleLots;
    const radiusMeters = radiusKm * 1000;
    return visibleLots.filter(
      (lot) => getDistanceInMeters(referenceLocation, { lat: lot.lat, lng: lot.lng }) <= radiusMeters
    );
  }, [visibleLots, referenceLocation, radiusKm]);
  const sortedSidebarLots = useMemo(() => {
    if (sortMode === 'distance') {
      if (!referenceLocation) return nearbyLots;
      return [...nearbyLots].sort(
        (a, b) =>
          getDistanceInMeters(referenceLocation, { lat: a.lat, lng: a.lng }) -
          getDistanceInMeters(referenceLocation, { lat: b.lat, lng: b.lng })
      );
    }
    const radiusMeters = radiusKm * 1000;
    return [...nearbyLots].sort(
      (a, b) =>
        getRecommendationScore(b, referenceLocation, radiusMeters) -
        getRecommendationScore(a, referenceLocation, radiusMeters)
    );
  }, [nearbyLots, sortMode, referenceLocation, radiusKm]);
  const isSheetOpen = selectedLotId !== null;

  const handleSelectLot = useCallback(
    (lot: ParkingLot) => {
      setSelectedLotId(lot.id);
      setShowSearchAreaButton(false);
      setMobileView('map');
      mapRef.current?.panTo({ lat: lot.lat, lng: lot.lng }, 4, isDesktop ? DESKTOP_PANEL_OFFSET_PX : undefined);
    },
    [isDesktop]
  );

  const handleSelectPlace = useCallback((place: PlaceResult) => {
    setSelectedLotId(null);
    setShowSearchAreaButton(false);
    setMobileView('map');
    // 목적지를 기준으로 반경/정렬이 계산되도록 검색 기준 위치를 이 지점으로 옮깁니다.
    setSearchOrigin({ lat: place.lat, lng: place.lng });
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
    // "내 위치" 버튼은 검색해둔 목적지 기준을 벗어나 다시 내 실시간 위치 기준으로 돌아갑니다.
    setSearchOrigin(null);
    if (userLocation) {
      mapRef.current?.panTo(userLocation, 5, isDesktop && isSheetOpen ? DESKTOP_PANEL_OFFSET_PX : undefined);
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
  // 범례는 데스크톱 전용(md:flex)이라, 열려 있을 때는 카드의 실제 렌더링 높이 바로 위(16px 간격)에
  // 붙입니다. 카드 자체가 화면 하단에서 16px(bottom-4) 띄워져 있어 그만큼도 함께 더해줍니다.
  // (예전엔 카드의 max-h인 55vh를 기준으로 계산했는데, 카드 내용이 그보다 짧으면 실제 카드 위로
  // 한참 뜬 채 허공에 떠 있는 문제가 있었습니다.)
  const legendBottomClass = isSheetOpen ? 'bottom-6' : 'bottom-20';
  const legendBottomStyle = isSheetOpen ? { bottom: desktopSheetHeightPx + 16 + 16 } : undefined;
  const showMapPane = isDesktop || mobileView === 'map';

  const sidebarList = (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-divider p-4">
        <h1 className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <ParkingPinIcon className="text-primary" />
          주차장 찾기
        </h1>
        <p className="mt-1 text-xs text-text-secondary">원하는 지역을 검색하고 실시간 주차 가능 여부를 확인하세요.</p>

        {lotsStatus === 'loading' ? (
          <Skeleton className="mt-4 h-10 rounded-full" />
        ) : (
          <div className="mt-4 flex gap-2">
            <div className="min-w-0 flex-1">
              <SearchBar
                parkingLots={visibleLots}
                userLocation={referenceLocation ?? SEOUL_CITY_HALL}
                onSelect={handleSelectLot}
                onSelectPlace={handleSelectPlace}
                placeholder="목적지나 주소를 입력하세요"
              />
            </div>
            {/* 검색은 입력하는 즉시 실시간으로 반영되므로, 이 버튼은 시각적 확인 용도입니다. */}
            <button
              type="button"
              className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <SearchIcon size={16} />
              검색
            </button>
          </div>
        )}

        {lotsStatus !== 'loading' && (
          <div className="mt-3">
            <FilterBar
              {...parkingFilters}
              favoritesOnly={favoritesOnly}
              onToggleFavoritesOnly={() => setFavoritesOnly((prev) => !prev)}
              radiusKm={radiusKm}
              onSetRadiusKm={setRadiusKm}
            />
          </div>
        )}
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
            disabled={!referenceLocation}
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
                : referenceLocation && nearbyLots.length === 0
                  ? `반경 ${radiusKm}km 이내에 등록된 주차장이 없어요.`
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
                  referenceLocation
                    ? getDistanceInMeters(referenceLocation, { lat: lot.lat, lng: lot.lng })
                    : undefined
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
          tentativeUserLocation={tentativePosition}
          onSelectLot={handleSelectLot}
          onViewportChange={() => setShowSearchAreaButton(true)}
        />

        {/*
          검색창/필터는 데스크톱에서는 왼쪽 사이드바 상단에 표시하므로(참고 디자인과 동일하게),
          여기서는 md:hidden으로 감춰 모바일(지도 화면)에서만 지도 위에 떠 있도록 합니다.
          권한 배너/이 지역 검색 버튼은 지도 자체와 관련된 것이라 모든 화면 크기에서 유지합니다.
        */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center gap-2 p-4">
          <div className="pointer-events-auto w-full max-w-xl md:hidden">
            {lotsStatus === 'loading' ? (
              <Skeleton className="h-12 rounded-full" />
            ) : (
              <SearchBar
                parkingLots={visibleLots}
                userLocation={referenceLocation ?? SEOUL_CITY_HALL}
                onSelect={handleSelectLot}
                onSelectPlace={handleSelectPlace}
                placeholder="목적지나 주소를 입력하세요"
              />
            )}
          </div>
          {lotsStatus !== 'loading' && (
            <div className="pointer-events-auto w-full max-w-xl md:hidden">
              <FilterBar
                {...parkingFilters}
                favoritesOnly={favoritesOnly}
                onToggleFavoritesOnly={() => setFavoritesOnly((prev) => !prev)}
                radiusKm={radiusKm}
                onSetRadiusKm={setRadiusKm}
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

        {/*
          지도 우측 상단 컨트롤 — 참고 디자인처럼 항상 떠 있는 실시간 토글.
          모바일은 검색창/필터 오버레이가 이미 상단 전체를 차지하므로 데스크톱에서만 보여줍니다.
          지도 확대/축소 컨트롤(우측)과 겹치지 않을 정도로만 오른쪽 여백을 둡니다.
        */}
        <div className="pointer-events-none absolute right-12 top-4 z-30 hidden items-center gap-2 md:flex">
          <div className="pointer-events-auto flex h-10 items-center rounded-full bg-white px-3 shadow-floating">
            <ToggleSwitch
              checked={isRealtimeOnly}
              onChange={() => setIsRealtimeOnly((prev) => !prev)}
              label="실시간 주차장만 보기"
            />
          </div>
        </div>

        <div
          className={`pointer-events-none absolute inset-x-0 z-30 hidden justify-center transition-[bottom] duration-300 md:flex ${legendBottomClass}`}
          style={legendBottomStyle}
        >
          <CongestionLegend variant="bar" />
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

        <BottomSheet
          lot={selectedLot}
          onClose={handleCloseSheet}
          isFavorite={selectedLot ? isFavorite(selectedLot.id) : false}
          onToggleFavorite={handleToggleFavorite}
          onDesktopHeightChange={setDesktopSheetHeightPx}
        />

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
