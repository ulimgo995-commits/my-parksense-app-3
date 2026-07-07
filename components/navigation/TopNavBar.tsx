'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Logo, LogoMark } from '@/components/common/Logo';
import { CloseIcon, HomeIcon, InfoIcon, MenuIcon, ParkingPinIcon, StarIcon, UserIcon } from '@/components/common/icons';

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
}

const ICON_CLASS = (active: boolean) => (active ? 'text-primary' : 'text-text-secondary');

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '홈', icon: (active) => <HomeIcon size={20} className={ICON_CLASS(active)} /> },
  {
    href: '/parking',
    label: '주차장 찾기',
    icon: (active) => <ParkingPinIcon size={20} className={ICON_CLASS(active)} />,
  },
  {
    href: '/favorites',
    label: '즐겨찾기',
    icon: (active) => <StarIcon size={20} filled={active} className={ICON_CLASS(active)} />,
  },
  { href: '/guide', label: '이용안내', icon: (active) => <InfoIcon size={20} className={ICON_CLASS(active)} /> },
  { href: '/profile', label: '내 정보', icon: (active) => <UserIcon size={20} className={ICON_CLASS(active)} /> },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 전 페이지 공통 상단 내비게이션. 데스크톱은 가로 탭, 모바일은 햄버거 드롭다운으로 표시합니다. */
export function TopNavBar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[70] border-b border-divider bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between py-2 pl-2 pr-4 md:h-16 md:pl-3 md:pr-6">
        <Link href="/" className="-ml-4 shrink-0 md:-ml-6" onClick={() => setIsMenuOpen(false)}>
          <span className="hidden md:inline-flex">
            <Logo height={38} />
          </span>
          <span className="inline-flex md:hidden">
            <LogoMark size={36} />
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={isMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-gray-100 md:hidden"
        >
          {isMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={22} />}
        </button>
      </div>

      {isMenuOpen && (
        <nav className="animate-fade-in-up border-t border-divider bg-white px-4 py-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  active ? 'bg-primary-light text-primary' : 'text-text-primary hover:bg-gray-50'
                }`}
              >
                {item.icon(active)}
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
