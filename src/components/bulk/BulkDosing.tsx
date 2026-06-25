'use client';

import React, { useState } from 'react';
import { Layers, Droplet, FlaskConical, Scale, Info, CheckSquare, Square } from 'lucide-react';
import { Tank, WaterTest } from '@/lib/types';
import { SalinityCalculator } from '@/lib/services/calculations/salinity';
import { ChemicalCalculator } from '@/lib/services/calculations/chemical';

interface BulkDosingProps {
  tanks: Tank[];
  waterTests: WaterTest[];
}

export default function BulkDosing({ tanks, waterTests }: BulkDosingProps) {
  const [paramType, setParamType] = useState<'salinity' | 'ph'>('salinity');
  const [targetVal, setTargetVal] = useState<number>(paramType === 'salinity' ? 20 : 8.2);
  const [selectedTankIds, setSelectedTankIds] = useState<number[]>(tanks.map(t => t.id));

  // Handle parameter toggle (reset defaults)
  const handleParamToggle = (type: 'salinity' | 'ph') => {
    setParamType(type);
    setTargetVal(type === 'salinity' ? 20 : 8.2);
  };

  // Toggle single tank selection
  const toggleTank = (id: number) => {
    setSelectedTankIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  // Toggle all tanks
  const toggleAll = () => {
    if (selectedTankIds.length === tanks.length) {
      setSelectedTankIds([]);
    } else {
      setSelectedTankIds(tanks.map(t => t.id));
    }
  };

  // Detailed calculations list
  const details: Array<{
    tank: Tank;
    currentVal: number;
    targetVal: number;
    chemical: string;
    amount: number; // in grams or liters
    unit: string;
    action: string;
    description: string;
  }> = [];

  selectedTankIds.forEach(tId => {
    const tank = tanks.find(t => t.id === tId);
    if (!tank) return;

    // Get latest water test
    const tankTests = waterTests.filter(t => t.tank_id === tId);
    let currentVal = 0;
    
    if (paramType === 'salinity') {
      if (tankTests.length > 0) {
        const latestTest = tankTests.reduce((latest, current) => {
          return new Date(current.test_date) > new Date(latest.test_date) ? current : latest;
        }, tankTests[0]);
        currentVal = latestTest.salinity_ppt;
      } else {
        currentVal = 15; // default fallback
      }

      // Calculate salinity adjustment
      const res = SalinityCalculator.calculateAdjustment(tank.volume_liters, currentVal, targetVal);
      details.push({
        tank,
        currentVal,
        targetVal,
        chemical: res.action === 'DECREASE' ? 'Freshwater' : 'Marine Salt',
        amount: res.amount,
        unit: res.unit,
        action: res.action,
        description: res.description
      });
    } else {
      // pH Buffer
      if (tankTests.length > 0) {
        const latestTest = tankTests.reduce((latest, current) => {
          return new Date(current.test_date) > new Date(latest.test_date) ? current : latest;
        }, tankTests[0]);
        currentVal = latestTest.ph;
      } else {
        currentVal = 7.8; // default fallback
      }

      // Calculate pH buffer adjustment
      const res = ChemicalCalculator.calculatePhBuffer(tank.volume_liters, currentVal, targetVal);
      details.push({
        tank,
        currentVal,
        targetVal,
        chemical: 'Sodium Bicarbonate',
        amount: res.amount,
        unit: res.unit,
        action: res.amount > 0 ? 'INCREASE' : 'NONE',
        description: res.description
      });
    }
  });

  // Consolidate Grand Totals
  const totals: Record<string, { amount: number; unit: string }> = {};
  details.forEach(item => {
    if (item.amount <= 0) return;
    const key = `${item.chemical} (${item.unit})`;
    if (!totals[key]) {
      totals[key] = { amount: 0, unit: item.unit };
    }
    totals[key].amount += item.amount;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary animate-pulse" />
          <span>Bulk Dosing Planner</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Plan and aggregate water quality adjustments across multiple enclosures simultaneously</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Controller Panel */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">
            Adjustment Controller
          </h3>

          {/* Param Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Adjustment Target Type</label>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full">
              <button
                onClick={() => handleParamToggle('salinity')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  paramType === 'salinity'
                    ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                    : 'text-slate-500'
                }`}
              >
                <Droplet className="h-3.5 w-3.5 text-sky-500" />
                <span>Salinity</span>
              </button>
              <button
                onClick={() => handleParamToggle('ph')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  paramType === 'ph'
                    ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                    : 'text-slate-500'
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
                <span>pH (Buffer)</span>
              </button>
            </div>
          </div>

          {/* Target Value Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {paramType === 'salinity' ? 'Target Salinity (ppt)' : 'Target pH'}
            </label>
            <input
              type="number"
              step="any"
              value={targetVal}
              onChange={(e) => setTargetVal(Number(e.target.value))}
              className="form-input text-sm font-semibold"
            />
          </div>

          {/* Tanks Selection Checklist */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Tanks ({selectedTankIds.length})</label>
              <button
                onClick={toggleAll}
                className="text-[10px] font-bold text-primary hover:underline uppercase"
              >
                {selectedTankIds.length === tanks.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tanks.map(tank => {
                const isSelected = selectedTankIds.includes(tank.id);
                return (
                  <button
                    key={tank.id}
                    onClick={() => toggleTank(tank.id)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-primary/20 bg-primary/5 text-slate-800 dark:text-slate-100'
                        : 'border-slate-200/50 dark:border-slate-850 text-slate-550'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{tank.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({tank.volume_liters.toLocaleString()} L)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Output details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Consolidated Material Shopping card */}
          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 dark:border-primary/10 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Scale className="h-4 w-4 text-primary" />
              <span>Consolidated Material Totals</span>
            </h3>

            {Object.keys(totals).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {Object.entries(totals).map(([key, data]) => {
                  const isSalt = key.includes('Salt');
                  const isWater = key.includes('Freshwater');
                  
                  let formattedAmount = '';
                  if (data.amount >= 1000 && data.unit === 'g') {
                    formattedAmount = `${(data.amount / 1000).toFixed(2)} kg`;
                  } else {
                    formattedAmount = `${Math.round(data.amount).toLocaleString()} ${data.unit}`;
                  }

                  return (
                    <div key={key} className="p-4 bg-white/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/45 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total {isSalt ? 'Marine Salt' : isWater ? 'Freshwater Dilution' : 'Sodium Bicarbonate'}
                      </span>
                      <h4 className="text-2xl font-extrabold tracking-tight text-slate-850 dark:text-white">
                        {formattedAmount}
                      </h4>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-450 text-xs">
                No active material additions needed. Ensure tanks are selected and targets require adjustment.
              </div>
            )}
          </div>

          {/* Details Table */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Tank-by-Tank Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4">Tank Name</th>
                    <th className="py-3 px-4">Volume</th>
                    <th className="py-3 px-4">Current → Target</th>
                    <th className="py-3 px-4">Adjustment Action</th>
                    <th className="py-3 px-4">Dose Weight / Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((item, idx) => {
                    const displayDose = item.amount >= 1000 && item.unit === 'g'
                      ? `${(item.amount / 1000).toFixed(2)} kg`
                      : `${item.amount.toLocaleString()} ${item.unit}`;
                    
                    return (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{item.tank.name}</td>
                        <td className="py-3 px-4 text-slate-550 font-semibold">{item.tank.volume_liters.toLocaleString()} L</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-650 dark:text-slate-350">{item.currentVal.toFixed(2)}</span>
                          <span className="text-slate-400 mx-1.5">→</span>
                          <span className="font-bold text-primary">{item.targetVal.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 font-medium ml-1">
                            {paramType === 'salinity' ? 'ppt' : 'pH'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.action === 'INCREASE' && (
                            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                              {paramType === 'salinity' ? 'Add Salt' : 'Buffer pH'}
                            </span>
                          )}
                          {item.action === 'DECREASE' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                              Dilute (Freshwater)
                            </span>
                          )}
                          {item.action === 'NONE' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              No action
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-150">
                          {item.amount > 0 ? displayDose : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {details.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        No tanks selected. Select tanks in the sidebar planner.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
