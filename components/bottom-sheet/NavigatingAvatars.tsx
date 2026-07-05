import { UserIcon } from '@/components/common/icons';
import { getAvatarPlaceholders, getNavigatingCount } from '@/utils/socialSignal';
import type { ParkingLot } from '@/types/parking';

interface NavigatingAvatarsProps {
  lot: ParkingLot;
}

/**
 * "길찾기 중인 사람 수" 소셜 지표. 실제 사용자 추적 데이터가 없는 MVP 단계라
 * utils/socialSignal.ts 의 결정적 샘플 값을 시각화합니다.
 */
export function NavigatingAvatars({ lot }: NavigatingAvatarsProps) {
  const count = getNavigatingCount(lot);
  const avatars = getAvatarPlaceholders(lot, 3);
  const overflow = count - avatars.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {avatars.map((avatar) => (
          <span
            key={avatar.id}
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-white"
            style={{ backgroundColor: avatar.color }}
          >
            <UserIcon size={12} />
          </span>
        ))}
        {overflow > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-semibold text-text-secondary">
            +{overflow}
          </span>
        )}
      </div>
      <span className="text-sm font-semibold text-primary">{count}명</span>
    </div>
  );
}
