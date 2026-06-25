import React from 'react';
import { TankRepository } from '@/lib/repositories/tank.repository';
import { WaterRepository } from '@/lib/repositories/water.repository';
import SalinityCalculator from '@/components/salinity/SalinityCalculator';

export const dynamic = 'force-dynamic';

export default async function SalinityCalculatorPage() {
  const tanks = TankRepository.getAllTanks();
  const waterTests = WaterRepository.getAllWaterTests();

  return (
    <div className="space-y-6">
      <SalinityCalculator
        tanks={tanks}
        waterTests={waterTests}
      />
    </div>
  );
}
