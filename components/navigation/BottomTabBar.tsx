import { CompassIcon, ParkingPinIcon, StarIcon, UserIcon } from '@/components/common/icons';
import type { AppTab } from '@/types/navigation';
import type { ReactNode } from 'react';

interface BottomTabBarProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

interface TabConfig {
  key: AppTab;
  label: string;
  icon: (active: boolean) => ReactNode;
}

const TABS: TabConfig[] = [
  { key: 'find', label: '주차장 찾기', icon: (active) => <ParkingPinIcon size={22} className={active ? 'text-primary' : 'text-text-secondary'} /> },
  { key: 'nearby', label: '내 주변', icon: (active) => <CompassIcon size={22} className={active ? 'text-primary' : 'text-text-secondary'} /> },
  { key: 'favorites', label: '즐겨찾기', icon: (active) => <StarIcon size={20} filled={active} className={active ? 'text-primary' : 'text-text-secondary'} /> },
  { key: 'profile', label: '내 정보', icon: (active) => <UserIcon size={22} className={active ? 'text-primary' : 'text-text-secondary'} /> },
];

/** 화면 하단 고정 탭 내비게이션 (주차장 찾기 / 내 주변 / 즐겨찾기 / 내 정보) */
export function BottomTabBar({ activeTab, onChange }: BottomTabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[60] flex justify-around border-t border-divider bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-1 flex-col items-center gap-0.5 py-2"
          >
            {tab.icon(isActive)}
            <span className={`text-[11px] font-medium ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
