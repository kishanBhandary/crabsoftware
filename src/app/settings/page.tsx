import React from 'react';
import { SettingsRepository } from '@/lib/repositories/settings.repository';
import SettingsContent from '@/components/settings/SettingsContent';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = SettingsRepository.getAllSettings();

  return (
    <div className="space-y-6">
      <SettingsContent
        initialSettings={settings}
      />
    </div>
  );
}
