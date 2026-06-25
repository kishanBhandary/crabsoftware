import React from 'react';
import { TankRepository } from '@/lib/repositories/tank.repository';
import { ChemicalRepository } from '@/lib/repositories/chemical.repository';
import ChemicalContent from '@/components/chemical/ChemicalContent';

export const dynamic = 'force-dynamic';

export default async function ChemicalDosingPage() {
  const tanks = TankRepository.getAllTanks();
  const history = ChemicalRepository.getAllChemicalHistory();

  return (
    <div className="space-y-6">
      <ChemicalContent
        tanks={tanks}
        initialHistory={history}
      />
    </div>
  );
}
