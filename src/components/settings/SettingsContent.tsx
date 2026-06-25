'use client';

import React, { useState } from 'react';
import { Settings, Save, Database, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';
import { updateSetting, backupDatabase } from '@/lib/actions';

interface SettingsContentProps {
  initialSettings: Record<string, string>;
}

export default function SettingsContent({ initialSettings }: SettingsContentProps) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  
  // Local inputs state
  const [tempUnit, setTempUnit] = useState(settings.temperature_unit || 'C');
  const [volUnit, setVolUnit] = useState(settings.volume_unit || 'L');
  const [alerts, setAlerts] = useState(settings.alert_notifications === 'true');
  const [autoBackup, setAutoBackup] = useState(settings.auto_backup === 'true');

  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Save general settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateSetting('temperature_unit', tempUnit);
      await updateSetting('volume_unit', volUnit);
      await updateSetting('alert_notifications', alerts ? 'true' : 'false');
      await updateSetting('auto_backup', autoBackup ? 'true' : 'false');

      setSettings({
        temperature_unit: tempUnit,
        volume_unit: volUnit,
        alert_notifications: alerts ? 'true' : 'false',
        auto_backup: autoBackup ? 'true' : 'false',
      });

      setToastMsg('Application settings saved successfully.');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // Trigger local database backup
  const handleBackupDb = async () => {
    setBackingUp(true);
    try {
      const res = await backupDatabase();
      if (res.success && res.filepath) {
        setToastMsg(`Database backup created! Path: ${res.filepath}`);
        setTimeout(() => setToastMsg(null), 5000);
      } else {
        alert(res.error || 'Failed to backup database.');
      }
    } catch (e) {
      alert('Backup failed.');
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <span>System Settings</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure unit parameters, offline safety alerts, and database maintenance</p>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General settings forms */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">
            Application Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Temp unit */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Temperature Measurement Unit</label>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full">
                <button
                  onClick={() => setTempUnit('C')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    tempUnit === 'C'
                      ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                      : 'text-slate-500'
                  }`}
                >
                  Celsius (°C)
                </button>
                <button
                  onClick={() => setTempUnit('F')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    tempUnit === 'F'
                      ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                      : 'text-slate-500'
                  }`}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            {/* Volume unit */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Water Volume Unit</label>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full">
                <button
                  onClick={() => setVolUnit('L')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    volUnit === 'L'
                      ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                      : 'text-slate-500'
                  }`}
                >
                  Liters (L)
                </button>
                <button
                  onClick={() => setVolUnit('Gal')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    volUnit === 'Gal'
                      ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                      : 'text-slate-500'
                  }`}
                >
                  US Gallons (gal)
                </button>
              </div>
            </div>
          </div>

          {/* Behavior Toggles */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Alerts toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-55/20 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-850 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Alert Visual Indicators</h4>
                <p className="text-[10px] text-slate-500">Color-code parameters exceeding optimal species limits in lists</p>
              </div>
              <button
                onClick={() => setAlerts(!alerts)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                  alerts ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full shadow transform duration-200 ${
                    alerts ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto backup toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-55/20 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-850 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Enable Automated Local Backups</h4>
                <p className="text-[10px] text-slate-500">Enable local database snapshots before major chemical logs</p>
              </div>
              <button
                onClick={() => setAutoBackup(!autoBackup)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                  autoBackup ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full shadow transform duration-200 ${
                    autoBackup ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Database & System info */}
        <div className="space-y-6">
          {/* Database Admin Card */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <Database className="h-4 w-4 text-emerald-500" />
              <span>Database Administration</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-205/30 text-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Storage Driver</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">SQLite + better-sqlite3</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-205/30 text-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">File Location (Offline)</span>
                <span className="font-mono text-[10px] break-all text-slate-600 dark:text-slate-350 select-all" title="Click to select all">
                  {process.env.USER_DATA_PATH ? `${process.env.USER_DATA_PATH}/crabshack.db` : './database/crabshack.db'}
                </span>
              </div>

              <button
                onClick={handleBackupDb}
                disabled={backingUp}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center gap-1.5"
              >
                <Cpu className="h-4 w-4" />
                <span>{backingUp ? 'Backing Up...' : 'Backup Database'}</span>
              </button>
            </div>
          </div>

          {/* Future Ready Slots Checklist */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-accent" />
              <span>Future-Ready Registry</span>
            </h3>

            <p className="text-[10px] text-slate-500 leading-normal">
              Architecture endpoints are isolated. The following modular extensions can be integrated with zero change to the core calculation or repository logic:
            </p>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-2 w-2 rounded-full bg-slate-400" />
                <span>Cloud Sync Handler (Slot Available)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-2 w-2 rounded-full bg-slate-400" />
                <span>User Authentication Wrapper</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-2 w-2 rounded-full bg-slate-400" />
                <span>License Key Decryptor</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-2 w-2 rounded-full bg-slate-400" />
                <span>REST API Sync Route</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
