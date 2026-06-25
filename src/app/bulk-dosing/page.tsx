import React from 'react';
import { TankRepository } from '@/lib/repositories/tank.repository';
import { WaterRepository } from '@/lib/repositories/water.repository';
import BulkDosing from '@/components/bulk/BulkDosing';

export const dynamic = 'force-dynamic';

export default async function BulkDosingPage() {
  const tanks = TankRepository.getAllTanks();
  const waterTests = WaterRepository.getAllWaterTests();

  return (
    <div className="space-y-6">
      <BulkDosing
        tanks={tanks}
        waterTests={waterTests}
      />
    </div>
  );
}
