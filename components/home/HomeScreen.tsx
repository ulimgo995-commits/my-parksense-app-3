'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KakaoMap, SEOUL_CITY_HALL, type KakaoMapHandle } from '@/components/map/KakaoMap';
import { CurrentLocationButton } from '@/components/map/CurrentLocationButton';
import { CongestionLegend } from '@/components/map/CongestionLegend';
import { SearchAreaButton } from '@/components/map/SearchAreaButton';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterBar } from '@/components/search/FilterBar';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { NearbyView } from '@/components/nearby/NearbyView';
import { FavoritesView } from '@/components/favorites/FavoritesView';
import { ProfileView } from '@/components/profile/ProfileView';
import { LocationPermissionBanner } from '@/components/permission/LocationPermissionBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useParkingFilters } from '@/hooks/useParkingFilters';
import { useFavorites } from '@/hooks/useFavorites';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import type { ParkingLot } from '@/types/parking';
import type { AppTab } from '@/types/navigation';

/** 데스크톱 좌측 상세 패널(w-[400px])에 선택한 마커가 가려지지 않도록 지도 중심을 오른쪽으로 미는 픽셀 값 */
const DESKTOP_PANEL_OFFSET_PX = 200;

/**
 * ParkSense 메인 화면.
 * 전체 화면 지도를 배경으로 검색창/필터/Bottom Sheet를 오버레이로 배치하고,
 * 하단 탭바로 주차장 찾기·내 주변·즐겨찾기·내 정보 화면을 전환합니다.
 * 지도는 탭이 바뀌어도 언마운트되지 않도록 항상 렌더링한 채 CSS로만 표시/숨김을 전환합니다.
 */
export function HomeScreen() {
  const { parkingLots, status: lotsStatus, error: lotsError, refetch } = useParkingLots();
  const { position: userLocation, status: geoStatus, errorReason, requestLocation } = useGeolocation();
  const parkingFilters = useParkingFilters(parkingLots);
  const { filteredLots } = parkingFilters;
  const { isFavorite, toggleFavorite, isLoaded: favoritesLoaded } = useFavorites();
  const { showToast } = useToast();
  const isDesktop = useIsDesktop();

  const [activeTab, setActiveTab] = useState<AppTab>('find');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const mapRef = useRef<KakaoMapHandle>(null);
  // 비동기 콜백(위치 업데이트 effect)에서 최신 선택 상태를 읽기 위한 ref (effect 의존성 배열에 넣지 않기 위함)
  const selectedLotIdRef = useRef(selectedLotId);
  selectedLotIdRef.current = selectedLotId;

  // 최초 진입 시 자동으로 위치 권한을 요청합니다 (requirements.md 3-1 Home 필수 기능).
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 현재 위치를 새로 얻을 때마다(최초 진입 포함) 지도 중심을 이동합니다.
  // (아래 handleCurrentLocationClick 에서 먼저 즉시 이동시키더라도, 비동기로 위치가
  // 갱신되면서 이 effect가 다시 실행되어 데스크톱 패널 보정을 덮어쓰지 않도록 여기서도 동일하게 보정합니다.)
  useEffect(() => {
    if (!userLocation) return;
    mapRef.current?.panTo(userLocation, 5);
    if (isDesktop && selectedLotIdRef.current !== null) {
      mapRef.current?.panByPixels(-DESKTOP_PANEL_OFFSET_PX, 0);
    }
  }, [userLocation, isDesktop]);

  useEffect(() => {
    if (geoStatus === 'error') setIsBannerDismissed(false);
  }, [geoStatus, errorReason]);

  // 지도가 display:none 상태였다가 "주차장 찾기" 탭으로 돌아오면 크기를 다시 계산해야
  // 타일이 잘리거나 클릭 좌표가 어긋나지 않습니다.
  useEffect(() => {
    if (activeTab === 'find') {
      mapRef.current?.relayout();
    }
  }, [activeTab]);

  const selectedLot = parkingLots.find((lot) => lot.id === selectedLotId) ?? null;
  const favoriteLots = useMemo(() => parkingLots.filter((lot) => isFavorite(lot.id)), [parkingLots, isFavorite]);
  const visibleLots = useMemo(
    () => (favoritesOnly ? filteredLots.filter((lot) => isFavorite(lot.id)) : filteredLots),
    [filteredLots, favoritesOnly, isFavorite]
  );
  const isSheetOpen = selectedLotId !== null;
  const showTabBar = activeTab !== 'find' || !isSheetOpen;

  const handleSelectLot = useCallback(
    (lot: ParkingLot) => {
      setActiveTab('find');
      setSelectedLotId(lot.id);
      setShowSearchAreaButton(false);
      mapRef.current?.panTo({ lat: lot.lat, lng: lot.lng }, 4);
      // 데스크톱에서는 좌측 상세 패널이 곧 열리므로, 마커가 패널에 가리지 않도록 중심을 오른쪽으로 밀어줍니다.
      if (isDesktop) {
        mapRef.current?.panByPixels(-DESKTOP_PANEL_OFFSET_PX, 0);
      }
    },
    [isDesktop]
  );

  const handleCloseSheet = useCallback(() => {
    setSelectedLotId(null);
    if (isDesktop) {
      mapRef.current?.panByPixels(DESKTOP_PANEL_OFFSET_PX, 0);
    }
  }, [isDesktop]);

  const handleCurrentLocationClick = useCallback(() => {
    if (userLocation) {
      mapRef.current?.panTo(userLocation, 5);
      if (isDesktop && isSheetOpen) {
        mapRef.current?.panByPixels(-DESKTOP_PANEL_OFFSET_PX, 0);
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
        console.warn('[HomeScreen] 즐겨찾기 처리 실패:', err);
        showToast('즐겨찾기 처리에 실패했어요. 잠시 후 다시 시도해주세요.', 'error');
      }
    },
    [toggleFavorite, showToast]
  );

  const handleSearchThisArea = useCallback(() => {
    const visibleIds = mapRef.current?.getVisibleLotIds() ?? [];
    const visibleCount = visibleLots.filter((lot) => visibleIds.includes(lot.id)).length;
    // 실제로 현재 화면 기준 마커/클러스터를 새로 그립니다 (드래그/줌만으로는 갱신되지 않음).
    mapRef.current?.refreshVisibleArea();
    setShowSearchAreaButton(false);
    showToast(
      visibleCount > 0 ? `이 지역에 주차장 ${visibleCount}곳이 있어요` : '이 지역에는 표시할 주차장이 없어요'
    );
  }, [visibleLots, showToast]);

  const showPermissionBanner = geoStatus === 'error' && !isBannerDismissed;
  const locationButtonBottomClass = isSheetOpen ? 'bottom-[calc(42vh+16px)] md:bottom-8' : 'bottom-24 md:bottom-20';
  const legendBottomClass = isSheetOpen ? 'bottom-6' : 'bottom-20';

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-100">
      {/* 지도는 탭 전환 시에도 언마운트되지 않도록 항상 렌더링하고 표시 여부만 전환합니다. */}
      <div className={`absolute inset-0 ${activeTab === 'find' ? 'block' : 'hidden'}`}>
        <KakaoMap
          ref={mapRef}
          parkingLots={visibleLots}
          selectedLotId={selectedLotId}
          userLocation={userLocation}
          onSelectLot={handleSelectLot}
          onViewportChange={() => setShowSearchAreaButton(true)}
        />
      </div>

      {activeTab === 'find' && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="pointer-events-auto w-full max-w-xl">
              {lotsStatus === 'loading' ? (
                <Skeleton className="h-12 rounded-full" />
              ) : (
                <SearchBar
                  parkingLots={visibleLots}
                  userLocation={userLocation ?? SEOUL_CITY_HALL}
                  onSelect={handleSelectLot}
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
                <LocationPermissionBanner
                  reason={errorReason}
                  onRetry={requestLocation}
                  onDismiss={() => setIsBannerDismissed(true)}
                />
              </div>
            )}
            {showSearchAreaButton && (
              <div className="pointer-events-auto">
                <SearchAreaButton onClick={handleSearchThisArea} />
              </div>
            )}
          </div>

          <div className={`pointer-events-none absolute left-6 z-30 hidden transition-[bottom] duration-300 md:block ${legendBottomClass}`}>
            <CongestionLegend />
          </div>

          <CurrentLocationButton
            onClick={handleCurrentLocationClick}
            isLoading={geoStatus === 'loading'}
            className={`pointer-events-auto absolute right-4 z-30 transition-[bottom] duration-300 md:right-6 ${locationButtonBottomClass}`}
          />

          <BottomSheet
            lot={selectedLot}
            onClose={handleCloseSheet}
            isFavorite={selectedLot ? isFavorite(selectedLot.id) : false}
            onToggleFavorite={handleToggleFavorite}
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

          {lotsStatus === 'success' && parkingLots.length > 0 && visibleLots.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
              <div className="pointer-events-auto rounded-2xl bg-white/95 shadow-floating">
                <EmptyState
                  icon="🔍"
                  title="조건에 맞는 주차장이 없어요"
                  description={favoritesOnly ? '즐겨찾기한 주차장이 없어요.' : '필터 조건을 조정해보세요.'}
                />
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'nearby' && (
        <div className="absolute inset-0 z-40">
          <NearbyView
            parkingLots={filteredLots}
            userLocation={userLocation}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onSelectLot={handleSelectLot}
          />
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="absolute inset-0 z-40">
          <FavoritesView
            favoriteLots={favoriteLots}
            isLoaded={favoritesLoaded}
            userLocation={userLocation}
            onToggleFavorite={handleToggleFavorite}
            onSelectLot={handleSelectLot}
          />
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="absolute inset-0 z-40">
          <ProfileView />
        </div>
      )}

      {showTabBar && <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />}
    </div>
  );
}
