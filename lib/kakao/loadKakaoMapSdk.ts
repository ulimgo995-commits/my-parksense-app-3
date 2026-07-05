const KAKAO_SDK_SCRIPT_ID = 'kakao-maps-sdk';

let loadPromise: Promise<void> | null = null;

/**
 * Kakao Maps JavaScript SDK를 1회만 로드하고 캐시된 Promise를 재사용합니다.
 * autoload=false 로 스크립트를 불러온 뒤 kakao.maps.load 콜백에서 resolve 하여
 * SDK 내부 리소스(지도 타일 엔진 등) 초기화가 끝난 시점을 정확히 보장합니다.
 */
export function loadKakaoMapSdk(appKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Kakao Maps SDK는 브라우저 환경에서만 로드할 수 있습니다.'));
  }

  if (window.kakao?.maps?.Map) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_SDK_SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (!window.kakao) {
        reject(new Error('Kakao Maps SDK 로드에 실패했습니다.'));
        return;
      }
      window.kakao.maps.load(() => resolve());
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Kakao Maps SDK 스크립트를 불러오지 못했습니다.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_SDK_SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener(
      'error',
      () => {
        loadPromise = null;
        reject(new Error('Kakao Maps SDK 스크립트를 불러오지 못했습니다.'));
      },
      { once: true }
    );

    document.head.appendChild(script);
  });

  return loadPromise;
}
