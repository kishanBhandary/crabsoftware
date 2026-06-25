'use client';

import React, { useState, useEffect } from 'react';
import { Droplet, Info, RefreshCw, Layers, ArrowRight } from 'lucide-react';
import { Tank, WaterTest } from '@/lib/types';
import { SalinityCalculator as SalCalc } from '@/lib/services/calculations/salinity';

interface SalinityCalculatorProps {
  tanks: Tank[];
  waterTests: WaterTest[];
}

export default function SalinityCalculator({ tanks, waterTests }: SalinityCalculatorProps) {
  const [selectedTankId, setSelectedTankId] = useState<number | 'custom'>('custom');
  
  // Input fields state
  const [volume, setVolume] = useState<number>(1000);
  const [currentSalinity, setCurrentSalinity] = useState<number>(15);
  const [targetSalinity, setTargetSalinity] = useState<number>(20);

  // Sync inputs when tank is selected
  useEffect(() => {
    if (selectedTankId === 'custom') return;

    const tank = tanks.find(t => t.id === selectedTankId);
    if (!tank) return;

    // 1. Set volume
    setVolume(tank.volume_liters);

    // 2. Set current salinity: find latest water test
    const tankTests = waterTests.filter(t => t.tank_id === selectedTankId);
    if (tankTests.length > 0) {
      const latestTest = tankTests.reduce((latest, current) => {
        return new Date(current.test_date) > new Date(latest.test_date) ? current : latest;
      }, tankTests[0]);
      setCurrentSalinity(latestTest.salinity_ppt);
    } else {
      setCurrentSalinity(0); // fallback if no readings logged
    }

    // 3. Set target salinity: default to midpoint of optimal range if stocked
    if (tank.optimal_salinity_min !== undefined && tank.optimal_salinity_max !== undefined) {
      const midpoint = (tank.optimal_salinity_min + tank.optimal_salinity_max) / 2;
      setTargetSalinity(midpoint);
    } else {
      setTargetSalinity(20); // default fallback
    }
  }, [selectedTankId, tanks, waterTests]);

  // Run calculation
  const result = SalCalc.calculateAdjustment(volume, currentSalinity, targetSalinity);

  // Format dosage amount
  const displayAmount = result.amount >= 1000 && result.unit === 'g'
    ? `${(result.amount / 1000).toFixed(2)} kg`
    : `${result.amount.toLocaleString()} ${result.unit}`;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Droplet className="h-5 w-5 text-sky-500" />
          <span>Salinity Adjuster Calculator</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Determine salt addition or freshwater replacement requirements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings panel */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Target Tank</label>
            <select
              value={selectedTankId}
              onChange={(e) => setSelectedTankId(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
              className="form-input text-sm font-semibold"
            >
              <option value="custom">Manual Entry (Custom Tank)</option>
              {tanks.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.species_name || 'Unstocked'})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Volume */}
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

            {/* Current Salinity */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Salinity (ppt)</label>
              <input
                type="number"
                step="any"
                value={currentSalinity}
                onChange={(e) => setCurrentSalinity(Math.max(0, Number(e.target.value)))}
                className="form-input text-sm font-semibold"
              />
            </div>

            {/* Target Salinity */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Salinity (ppt)</label>
              <input
                type="number"
                step="any"
                value={targetSalinity}
                onChange={(e) => setTargetSalinity(Math.max(0, Number(e.target.value)))}
                className="form-input text-sm font-semibold"
              />
            </div>
          </div>

          {selectedTankId !== 'custom' && (
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-xs text-primary flex items-start gap-2.5">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Linked Tank Mode Active</p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Volume preloaded from {tanks.find(t => t.id === selectedTankId)?.name}. Current salinity matches the latest logged reading. Target salinity aligns with the optimal stocked guidelines midpoint.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Outputs display */}
        <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-sky-500/5 flex flex-col justify-between border-2 border-primary/20 dark:border-primary/10">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <RefreshCw className="h-4 w-4 text-sky-500" />
              <span>Dosing Recommendation</span>
            </h3>

            <div className="space-y-6 pt-4">
              {/* Output type badge */}
              <div>
                {result.action === 'INCREASE' && (
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wide">
                    Increase Salinity
                  </span>
                )}
                {result.action === 'DECREASE' && (
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wide">
                    Dilute Salinity
                  </span>
                )}
                {result.action === 'NONE' && (
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide">
                    Salinity Normal
                  </span>
                )}
              </div>

              {/* Major output weight */}
              {result.action !== 'NONE' && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block">Required Adjustment</span>
                  <h4 className="text-4xl font-extrabold tracking-tight text-slate-850 dark:text-white">
                    {displayAmount}
                  </h4>
                </div>
              )}

              {/* Verbal instructions */}
              <p className="text-xs font-medium text-slate-650 dark:text-slate-350 leading-relaxed">
                {result.description}
              </p>
            </div>
          </div>

          {/* Guidelines info */}
          <div className="text-[10px] text-slate-400 mt-8 border-t border-slate-200/50 dark:border-slate-850 pt-3 space-y-1">
            <p>• 1 ppt salinity = 1 gram of salt per liter of water.</p>
            <p>• Make adjustments slowly to prevent osmotic shock in crabs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
