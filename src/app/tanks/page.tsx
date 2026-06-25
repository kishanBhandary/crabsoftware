import React from 'react';
import { TankRepository } from '@/lib/repositories/tank.repository';
import TankContent from '@/components/tank/TankContent';

export const dynamic = 'force-dynamic';

export default async function TanksPage() {
  const tanks = TankRepository.getAllTanks();
  const species = TankRepository.getAllSpecies();

  return (
    <div className="space-y-6">
      <TankContent
        initialTanks={tanks}
        speciesList={species}
      />
    </div>
  );
}
