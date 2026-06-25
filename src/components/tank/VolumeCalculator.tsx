'use client';

import React, { useState } from 'react';
import { Ruler, Sparkles, Copy, Check, Info } from 'lucide-react';
import { VolumeCalculator as VolCalc } from '@/lib/services/calculations/volume';

export default function VolumeCalculator() {
  const [shape, setShape] = useState<'rectangular' | 'cylindrical'>('rectangular');
  const [unitType, setUnitType] = useState<'m' | 'cm'>('m');
  
  // Rectangular dimensions
  const [length, setLength] = useState<number>(3.0);
  const [width, setWidth] = useState<number>(2.0);
  const [depthRect, setDepthRect] = useState<number>(1.2);

  // Cylindrical dimensions
  const [radius, setRadius] = useState<number>(1.5);
  const [depthCyl, setDepthCyl] = useState<number>(1.5);

  const [copied, setCopied] = useState(false);

  // Calculate volume
  let volumeLiters = 0;
  if (shape === 'rectangular') {
    volumeLiters = unitType === 'm'
      ? VolCalc.rectangular(length, width, depthRect)
      : VolCalc.rectangularCm(length, width, depthRect);
  } else {
    volumeLiters = unitType === 'm'
      ? VolCalc.cylindrical(radius, depthCyl)
      : VolCalc.cylindricalCm(radius, depthCyl);
  }

  // Rounded values
  const liters = Math.round(volumeLiters * 10) / 10;
  const gallons = Math.round(volumeLiters * 0.264172 * 10) / 10;

  const handleCopy = () => {
    navigator.clipboard.writeText(liters.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          <span>Tank Volume Calculator</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Determine tank liquid holding capacities based on dimensions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input parameters */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setShape('rectangular')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  shape === 'rectangular'
                    ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                }`}
              >
                Rectangular Enclosure
              </button>
              <button
                onClick={() => setShape('cylindrical')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  shape === 'cylindrical'
                    ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                }`}
              >
                Cylindrical Tank
              </button>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setUnitType('m')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  unitType === 'm'
                    ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                    : 'text-slate-500'
                }`}
              >
                Meters (m)
              </button>
              <button
                onClick={() => setUnitType('cm')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  unitType === 'cm'
                    ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-150 shadow'
                    : 'text-slate-500'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {shape === 'rectangular' ? (
              <>
                {/* Length */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Length ({unitType})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={length}
                    onChange={(e) => setLength(Math.max(0, Number(e.target.value)))}
                    className="form-input text-sm font-semibold"
                  />
                </div>

                {/* Width */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Width ({unitType})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={width}
                    onChange={(e) => setWidth(Math.max(0, Number(e.target.value)))}
                    className="form-input text-sm font-semibold"
                  />
                </div>

                {/* Depth */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Water Depth ({unitType})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={depthRect}
                    onChange={(e) => setDepthRect(Math.max(0, Number(e.target.value)))}
                    className="form-input text-sm font-semibold"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Radius */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Radius ({unitType})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={radius}
                    onChange={(e) => setRadius(Math.max(0, Number(e.target.value)))}
                    className="form-input text-sm font-semibold"
                  />
                </div>

                {/* Depth */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Water Depth ({unitType})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={depthCyl}
                    onChange={(e) => setDepthCyl(Math.max(0, Number(e.target.value)))}
                    className="form-input text-sm font-semibold"
                  />
                </div>
                <div className="hidden sm:block"></div>
              </>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800/45 text-xs text-slate-500 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p>
              For accuracy, measure from the bottom of the enclosure to the actual water line rather than the rim height. This isolates the precise volume of water currently housed.
            </p>
          </div>
        </div>

        {/* Results view */}
        <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 flex flex-col justify-between border-2 border-primary/20 dark:border-primary/10">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Calculated Output</span>
            </h3>

            <div className="space-y-6 pt-4">
              {/* Liters */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Volume in Liters</span>
                <div className="flex items-baseline justify-between">
                  <h4 className="text-4xl font-extrabold text-slate-850 dark:text-white tracking-tight">
                    {liters.toLocaleString()} L
                  </h4>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 text-slate-650 dark:text-slate-350 transition-all border border-slate-250/20"
                    title="Copy Liters to Clipboard"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500 animate-scale" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Gallons */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Volume in US Gallons</span>
                <h4 className="text-2xl font-bold text-slate-600 dark:text-slate-300">
                  {gallons.toLocaleString()} gal
                </h4>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-8 border-t border-slate-200/50 dark:border-slate-850 pt-3">
            * 1 cubic meter of water = 1,000 liters. Gallons calculated as L × 0.264172.
          </div>
        </div>
      </div>
    </div>
  );
}
