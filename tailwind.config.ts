import type { Config } from 'tailwindcss';

/**
 * ParkSense 디자인 가이드 기준 컬러 / 타이포 / 애니메이션 토큰.
 * docs/desin-guide.md.md 의 컬러 시스템을 그대로 반영합니다.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#DBEAFE',
        },
        success: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#FACC15',
          light: '#FEF9C3',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        full: {
          DEFAULT: '#374151',
          light: '#E5E7EB',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
        divider: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
      borderRadius: {
        sheet: '24px',
      },
      boxShadow: {
        floating: '0 8px 24px rgba(17, 24, 39, 0.12)',
        sheet: '0 -8px 32px rgba(17, 24, 39, 0.16)',
        card: '0 2px 8px rgba(17, 24, 39, 0.08)',
      },
      keyframes: {
        'marker-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'marker-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'marker-pop': 'marker-pop 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'marker-bounce': 'marker-bounce 600ms ease-in-out',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 200ms ease-out',
        'fade-in-up': 'fade-in-up 240ms ease-out',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};

export default config;
