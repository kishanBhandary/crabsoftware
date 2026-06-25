import React from 'react';
import { TankRepository } from '@/lib/repositories/tank.repository';
import { WaterRepository } from '@/lib/repositories/water.repository';
import { ChemicalRepository } from '@/lib/repositories/chemical.repository';
import DashboardContent from '@/components/dashboard/DashboardContent';

// Force dynamic rendering so server actions and queries reflect changes immediately
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Fetch initial data from local SQLite database using repositories
  const tanks = TankRepository.getAllTanks();
  const waterTests = WaterRepository.getAllWaterTests();
  const chemicalHistory = ChemicalRepository.getAllChemicalHistory();
  const species = TankRepository.getAllSpecies();

  return (
    <div className="space-y-6">
      <DashboardContent
        initialTanks={tanks}
        initialWaterTests={waterTests}
        initialChemicalHistory={chemicalHistory}
        initialSpecies={species}
      />
    </div>
  );
}
