import React from 'react';
import { TankRepository } from '@/lib/repositories/tank.repository';
import { WaterRepository } from '@/lib/repositories/water.repository';
import WaterRecordsContent from '@/components/salinity/WaterRecordsContent';

export const dynamic = 'force-dynamic';

export default async function WaterRecordsPage() {
  const tanks = TankRepository.getAllTanks();
  const waterTests = WaterRepository.getAllWaterTests();

  return (
    <div className="space-y-6">
      <WaterRecordsContent
        tanks={tanks}
        initialWaterTests={waterTests}
      />
    </div>
  );
}
