import type { ParkingLotType } from '@/types/parking';

export const PARKING_LOT_TYPE_LABEL: Record<ParkingLotType, string> = {
  offStreet: '노외',
  onStreet: '노상',
};

export const PARKING_LOT_TYPES: ParkingLotType[] = ['offStreet', 'onStreet'];
