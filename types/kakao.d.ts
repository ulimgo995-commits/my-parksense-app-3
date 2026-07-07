/**
 * Kakao Maps JavaScript SDK ambient 타입 선언.
 *
 * 공식 @types 패키지가 존재하지 않아 프로젝트에서 실제로 사용하는 API 표면만
 * 최소한으로 선언합니다. 필요한 API가 늘어나면 이 파일에 추가하세요.
 * 참고: https://apis.map.kakao.com/web/documentation/
 *
 * 주의: 네임스페이스 멤버는 반드시 `export` 를 붙여야 `kakao.maps.XXX` 형태로
 * 외부에서 참조할 수 있습니다 (ambient namespace도 동일한 규칙이 적용됩니다).
 */

declare namespace kakao.maps {
  export class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  export class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    extend(latlng: LatLng): void;
    contain(latlng: LatLng): boolean;
  }

  export interface MapOptions {
    center: LatLng;
    level?: number;
    draggable?: boolean;
    scrollwheel?: boolean;
    disableDoubleClick?: boolean;
    disableDoubleClickZoom?: boolean;
  }

  export class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    setLevel(level: number, options?: { anchor?: LatLng; animate?: boolean }): void;
    getLevel(): number;
    panTo(latlng: LatLng): void;
    panBy(dx: number, dy: number): void;
    getBounds(): LatLngBounds;
    setBounds(
      bounds: LatLngBounds,
      paddingTop?: number,
      paddingRight?: number,
      paddingBottom?: number,
      paddingLeft?: number
    ): void;
    relayout(): void;
    addControl(control: ZoomControl, position: ControlPosition): void;
  }

  export enum ControlPosition {
    TOP = 1,
    TOPLEFT,
    TOPRIGHT,
    LEFT,
    RIGHT,
    BOTTOMLEFT,
    BOTTOM,
    BOTTOMRIGHT,
  }

  export class ZoomControl {
    constructor();
  }

  export interface CustomOverlayOptions {
    position: LatLng;
    content: string | HTMLElement;
    map?: Map;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
  }

  export class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    setPosition(latlng: LatLng): void;
    setZIndex(zIndex: number): void;
  }

  export interface MarkerImageOptions {
    offset?: Point;
  }

  export class Size {
    constructor(width: number, height: number);
  }

  export class Point {
    constructor(x: number, y: number);
  }

  export class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions);
  }

  export interface MarkerOptions {
    position: LatLng;
    map?: Map;
    image?: MarkerImage;
    title?: string;
    zIndex?: number;
    clickable?: boolean;
  }

  export class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latlng: LatLng): void;
    getPosition(): LatLng;
  }

  export interface PolylineOptions {
    path: LatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: 'solid' | 'shortdash' | 'shortdot' | 'shortdashdot' | 'dash' | 'dot' | 'dashdot' | 'longdash';
    map?: Map;
  }

  export class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
    setPath(path: LatLng[]): void;
  }

  export namespace event {
    export function addListener(
      target: Map | Marker | CustomOverlay,
      type: string,
      handler: (...args: never[]) => void
    ): void;
    export function removeListener(
      target: Map | Marker | CustomOverlay,
      type: string,
      handler: (...args: never[]) => void
    ): void;
  }

  export namespace services {
    export enum Status {
      OK = 'OK',
      ZERO_RESULT = 'ZERO_RESULT',
      ERROR = 'ERROR',
    }

    export interface PlacesSearchResultItem {
      id: string;
      place_name: string;
      address_name: string;
      road_address_name: string;
      x: string;
      y: string;
    }

    export type PlacesSearchResult = PlacesSearchResultItem[];

    export class Places {
      keywordSearch(keyword: string, callback: (result: PlacesSearchResult, status: Status) => void): void;
    }
  }

  export function load(callback: () => void): void;
}

interface Window {
  kakao: typeof kakao;
}
