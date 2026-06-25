import React from 'react';
import { TankRepository } from '@/lib/repositories/tank.repository';
import { WaterRepository } from '@/lib/repositories/water.repository';
import { ChemicalRepository } from '@/lib/repositories/chemical.repository';
import { ReportRepository } from '@/lib/repositories/report.repository';
import ReportsContent from '@/components/reports/ReportsContent';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const tanks = TankRepository.getAllTanks();
  const waterTests = WaterRepository.getAllWaterTests();
  const chemicalHistory = ChemicalRepository.getAllChemicalHistory();
  const reports = ReportRepository.getAllReports();

  return (
    <div className="space-y-6">
      <ReportsContent
        tanks={tanks}
        waterTests={waterTests}
        chemicalHistory={chemicalHistory}
        initialReports={reports}
      />
    </div>
  );
}
