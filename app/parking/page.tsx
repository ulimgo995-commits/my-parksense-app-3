import { Suspense } from 'react';
import { ParkingFinderScreen } from '@/components/parking-finder/ParkingFinderScreen';

export default function ParkingPage() {
  return (
    <Suspense fallback={null}>
      <ParkingFinderScreen />
    </Suspense>
  );
}
