'use client';

import React, { useState, useEffect } from 'react';
import { FlaskConical, ClipboardList, Info, Trash2, CheckCircle, Plus } from 'lucide-react';
import { Tank, ChemicalHistory } from '@/lib/types';
import { ChemicalCalculator as ChemCalc } from '@/lib/services/calculations/chemical';
import { createChemicalHistory, deleteChemicalHistory } from '@/lib/actions';

interface ChemicalContentProps {
  tanks: Tank[];
  initialHistory: ChemicalHistory[];
}

export default function ChemicalContent({ tanks, initialHistory }: ChemicalContentProps) {
  const [history, setHistory] = useState<ChemicalHistory[]>(initialHistory);
  const [selectedTankId, setSelectedTankId] = useState<number | 'custom'>('custom');
  const [calcType, setCalcType] = useState<'ph' | 'carbon' | 'chlorine'>('ph');

  // Input states
  const [volume, setVolume] = useState<number>(1000);
  
  // pH input
  const [currentPh, setCurrentPh] = useState<number>(7.8);
  const [targetPh, setTargetPh] = useState<number>(8.2);

  // Carbon input
  const [ammonia, setAmmonia] = useState<number>(1.2);
  const [cnRatio, setCnRatio] = useState<number>(15);

  // Chlorine input
  const [targetChlorine, setTargetChlorine] = useState<number>(10);
  const [activePercent, setActivePercent] = useState<number>(65);

  // Custom log reason
  const [customReason, setCustomReason] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync volume if tank changes
  useEffect(() => {
    if (selectedTankId !== 'custom') {
      const tank = tanks.find(t => t.id === selectedTankId);
      if (tank) {
        setVolume(tank.volume_liters);
      }
    }
  }, [selectedTankId, tanks]);

  // Compute recommendation
  let calcResult = { chemicalName: '', amount: 0, unit: 'g', description: '' };
  if (calcType === 'ph') {
    calcResult = ChemCalc.calculatePhBuffer(volume, currentPh, targetPh);
  } else if (calcType === 'carbon') {
    calcResult = ChemCalc.calculateBioflocCarbonSource(volume, ammonia, cnRatio);
  } else {
    calcResult = ChemCalc.calculateChlorineDisinfection(volume, targetChlorine, activePercent);
  }

  // Handle logging dose to database
  const handleLogDose = async () => {
    if (selectedTankId === 'custom') {
      alert('To log a dose in the database, please select an existing tank from the dropdown.');
      return;
    }

    if (calcResult.amount <= 0) {
      alert('Nothing to log (dosage amount is 0).');
      return;
    }

    const payload = {
      tank_id: selectedTankId,
      event_date: new Date().toISOString().split('T')[0],
      chemical_name: calcResult.chemicalName,
      amount_grams: calcResult.amount,
      reason: customReason.trim() || calcResult.description
    };

    const res = await createChemicalHistory(payload);
    if (res.success && res.id) {
      const loggedTank = tanks.find(t => t.id === selectedTankId);
      const newHistory: ChemicalHistory = {
        id: Number(res.id),
        ...payload,
        created_at: new Date().toISOString(),
        tank_name: loggedTank?.name || `Tank #${selectedTankId}`
      };

      setHistory(prev => [newHistory, ...prev]);
      setCustomReason('');
      setSuccessMsg(`Successfully logged ${payload.amount_grams}g of ${payload.chemical_name} to ${newHistory.tank_name}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      alert('Failed to log chemical dose.');
    }
  };

  // Handle delete log
  const handleDeleteLog = async (id: number) => {
    if (confirm('Are you sure you want to delete this dosing log?')) {
      const res = await deleteChemicalHistory(id);
      if (res.success) {
        setHistory(prev => prev.filter(h => h.id !== id));
      } else {
        alert('Failed to delete dosing log.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-500" />
            <span>Chemical Dosing Manager</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Calculate chemical amounts and log treatments applied to tanks</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs Column */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          {/* Tab selector */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setCalcType('ph')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                calcType === 'ph'
                  ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                  : 'text-slate-500'
              }`}
            >
              pH Buffer
            </button>
            <button
              onClick={() => setCalcType('carbon')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                calcType === 'carbon'
                  ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                  : 'text-slate-500'
              }`}
            >
              Biofloc Carbon (Molasses)
            </button>
            <button
              onClick={() => setCalcType('chlorine')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                calcType === 'chlorine'
                  ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                  : 'text-slate-500'
              }`}
            >
              Chlorine Disinfection
            </button>
          </div>

          {/* Tank select & Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Tank</label>
              <select
                value={selectedTankId}
                onChange={(e) => setSelectedTankId(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
                className="form-input text-sm font-semibold"
              >
                <option value="custom">Manual (Custom Volume)</option>
                {tanks.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.volume_liters.toLocaleString()} L)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Water Volume (Liters)</label>
              <input
                type="number"
                value={volume}
                disabled={selectedTankId !== 'custom'}
                onChange={(e) => setVolume(Math.max(0, Number(e.target.value)))}
                className="form-input text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Dynamic input sections based on calcType */}
          {calcType === 'ph' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current pH</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentPh}
                  onChange={(e) => setCurrentPh(Number(e.target.value))}
                  className="form-input text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target pH</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetPh}
                  onChange={(e) => setTargetPh(Number(e.target.value))}
                  className="form-input text-sm font-semibold"
                />
              </div>
            </div>
          )}

          {calcType === 'carbon' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Ammonia Level (ppm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ammonia}
                  onChange={(e) => setAmmonia(Number(e.target.value))}
                  className="form-input text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target C:N Ratio</label>
                <input
                  type="number"
                  value={cnRatio}
                  onChange={(e) => setCnRatio(Number(e.target.value))}
                  className="form-input text-sm font-semibold"
                />
              </div>
            </div>
          )}

          {calcType === 'chlorine' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Chlorine (ppm)</label>
                <input
                  type="number"
                  value={targetChlorine}
                  onChange={(e) => setTargetChlorine(Number(e.target.value))}
                  className="form-input text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Chlorine in Agent (%)</label>
                <input
                  type="number"
                  value={activePercent}
                  onChange={(e) => setActivePercent(Number(e.target.value))}
                  className="form-input text-sm font-semibold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results / Logging Column */}
        <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 flex flex-col justify-between border-2 border-primary/20 dark:border-primary/10">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <FlaskConical className="h-4 w-4 text-amber-500" />
              <span>Recommended Dose</span>
            </h3>

            <div className="space-y-5 pt-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chemical Agent</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-150 block">{calcResult.chemicalName}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Required Dosage</span>
                <h4 className="text-4xl font-extrabold tracking-tight text-slate-850 dark:text-white">
                  {calcResult.amount.toLocaleString()} g
                </h4>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {calcResult.description}
              </p>

              {/* Log entry inputs (Only show if a valid tank is selected) */}
              {selectedTankId !== 'custom' && (
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Override Log Reason (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Regular adjustment"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>

                  <button
                    onClick={handleLogDose}
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Log Dose to Database</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {successMsg && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-start gap-2 animate-pulse">
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Dosing safety guidelines */}
          <div className="text-[9px] text-slate-400 mt-6 border-t border-slate-200/50 dark:border-slate-850 pt-3">
            * Always dissolve buffers and active chemical agents in a bucket of fresh/pond water before distributing them evenly across the system.
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-slate-500" />
            <span>Chemical Dosing Log</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chronological record of chemical treatments logged to the database</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Tank Name</th>
                <th className="py-3 px-4">Chemical Applied</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-355">{log.event_date}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{log.tank_name || `Tank #${log.tank_id}`}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10 text-[10px] font-semibold">
                      {log.chemical_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold">{log.amount_grams.toLocaleString()} g</td>
                  <td className="py-3.5 px-4 text-slate-450 italic max-w-sm truncate" title={log.reason || ''}>{log.reason || '—'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No dosing history has been recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
