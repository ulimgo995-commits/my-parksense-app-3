'use client';

import { useState } from 'react';

interface RawResult {
  label: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  timestamp: string;
}

interface RawError {
  label: string;
  code: number;
  message: string;
}

/**
 * 임시 진단 페이지 — 앱의 useGeolocation 훅을 전혀 거치지 않고 브라우저의
 * navigator.geolocation API를 직접 호출한 결과를 화면에 그대로 보여줍니다.
 * "계룡으로 뜨는 게 우리 앱 로직 문제인지, 브라우저/OS가 원래 그렇게 보고하는지"를
 * 개발자도구 없이도 폰 화면에서 바로 확인하기 위한 용도입니다. 원인 파악 후 삭제하세요.
 */
export default function DebugLocationPage() {
  const [results, setResults] = useState<RawResult[]>([]);
  const [errors, setErrors] = useState<RawError[]>([]);

  const runRawCheck = (label: string, options: PositionOptions) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErrors((prev) => [...prev, { label, code: -1, message: 'navigator.geolocation 자체가 없음' }]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setResults((prev) => [
          ...prev,
          {
            label,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
            timestamp: new Date(pos.timestamp).toLocaleTimeString(),
          },
        ]);
      },
      (err) => {
        setErrors((prev) => [...prev, { label, code: err.code, message: err.message }]);
      },
      options
    );
  };

  const runAll = () => {
    setResults([]);
    setErrors([]);
    runRawCheck('캐시 허용(maximumAge 30초, 앱과 동일 옵션)', {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000,
    });
    runRawCheck('캐시 없이 강제 새 조회(maximumAge 0)', {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  };

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', fontSize: 14, lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>위치 진단 (임시)</h1>
      <p style={{ marginBottom: 12, color: '#555' }}>
        앱 로직을 전혀 거치지 않고 브라우저 API를 직접 두 가지 방식으로 호출합니다. 버튼을 누르고 위치 권한을 허용해주세요.
      </p>
      <button
        type="button"
        onClick={runAll}
        style={{
          padding: '10px 16px',
          borderRadius: 8,
          background: '#2563EB',
          color: '#fff',
          fontWeight: 700,
          border: 'none',
        }}
      >
        지금 위치 확인하기
      </button>

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 6 }}>성공 결과</h2>
        {results.length === 0 && <p style={{ color: '#999' }}>아직 없음</p>}
        {results.map((r, i) => (
          <div key={i} style={{ marginBottom: 10, padding: 8, background: '#f3f4f6', borderRadius: 8 }}>
            <div>
              <b>{r.label}</b>
            </div>
            <div>lat: {r.lat}</div>
            <div>lng: {r.lng}</div>
            <div>accuracy: {r.accuracyMeters.toFixed(1)}m</div>
            <div>timestamp: {r.timestamp}</div>
            <div>
              <a
                href={`https://map.kakao.com/link/map/here,${r.lat},${r.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2563EB' }}
              >
                카카오맵에서 이 좌표 확인하기 →
              </a>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 6 }}>에러</h2>
        {errors.length === 0 && <p style={{ color: '#999' }}>없음</p>}
        {errors.map((e, i) => (
          <div key={i} style={{ marginBottom: 10, padding: 8, background: '#fee2e2', borderRadius: 8 }}>
            <div>
              <b>{e.label}</b>
            </div>
            <div>code: {e.code}</div>
            <div>message: {e.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
