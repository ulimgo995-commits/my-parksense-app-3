interface SkeletonProps {
  className?: string;
}

/** 로딩 중 컨텐츠 자리 표시용 펄스 애니메이션 블록 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}
