import Image from 'next/image';

// 실제 로고 이미지(docs/logo-design.md.png)에서 잘라낸 자산의 원본 비율.
const MARK_ASPECT = 268 / 278;
const FULL_ASPECT = 1091 / 278;

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** ParkFlow 로고의 파란 P(핀+자동차) 마크만 (좁은 공간/모바일 내비게이션용) */
export function LogoMark({ size = 32, className = '' }: LogoMarkProps) {
  return (
    <Image
      src="/logo-mark.png"
      alt="ParkFlow"
      width={Math.round(size * MARK_ASPECT)}
      height={size}
      className={className}
      priority
    />
  );
}

interface LogoProps {
  /** 로고 전체 높이(px). 너비는 원본 비율에 맞춰 자동 계산됩니다. */
  height?: number;
  className?: string;
}

/** ParkFlow 아이콘 + 워드마크 전체 이미지 (데스크톱 상단 내비게이션 등 공간이 넉넉한 곳용) */
export function Logo({ height = 32, className = '' }: LogoProps) {
  return (
    <Image
      src="/logo-full.png"
      alt="ParkFlow"
      width={Math.round(height * FULL_ASPECT)}
      height={height}
      className={className}
      priority
    />
  );
}
