import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** 검색 결과 없음 / 주차장 없음 등 빈 상태를 표현하는 공용 컴포넌트 */
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 py-10 text-center animate-fade-in ${className}`}>
      {icon && <div className="text-4xl">{icon}</div>}
      <p className="text-base font-semibold text-text-primary">{title}</p>
      {description && <p className="text-sm text-text-secondary">{description}</p>}
      {action}
    </div>
  );
}
