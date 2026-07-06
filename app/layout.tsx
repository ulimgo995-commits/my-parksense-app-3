import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/common/ToastProvider';
import { TopNavBar } from '@/components/navigation/TopNavBar';
import './globals.css';

export const metadata: Metadata = {
  title: 'ParkFlow | 목적지 기반 주차장 혼잡도 안내',
  description: '지원 지역 주차장의 실시간 혼잡도를 지도에서 바로 확인하고 가장 적합한 주차장을 찾아보세요.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard: 디자인 가이드 지정 폰트 (Fallback: Noto Sans KR / system sans-serif) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="font-sans antialiased">
        <ToastProvider>
          <div className="flex h-dvh flex-col overflow-hidden">
            <TopNavBar />
            <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
