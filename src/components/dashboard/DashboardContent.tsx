'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Waves, 
  AlertTriangle, 
  FlaskConical, 
  TrendingUp, 
  Plus, 
  Activity, 
  CheckCircle,
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react';
import { Tank, WaterTest, ChemicalHistory, Species } from '@/lib/types';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

interface DashboardContentProps {
  initialTanks: Tank[];
  initialWaterTests: WaterTest[];
  initialChemicalHistory: ChemicalHistory[];
  initialSpecies: Species[];
}

export default function DashboardContent({
  initialTanks,
  initialWaterTests,
  initialChemicalHistory,
  initialSpecies,
}: DashboardContentProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState<number | 'all'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute stats
  const totalTanks = initialTanks.length;
  const totalSpecies = initialSpecies.length;
  
  // Find alerts: tanks whose latest water test violates optimal ranges
  const alerts: Array<{ tank: Tank; parameter: string; current: number; optimal: string; level: 'warning' | 'danger' }> = [];
  
  initialTanks.forEach(tank => {
    // Get latest test
    const tests = initialWaterTests.filter(t => t.tank_id === tank.id);
    if (tests.length === 0) return;
    
    // Sort tests to get latest by date
    const latestTest = tests.reduce((latest, current) => {
      return new Date(current.test_date) > new Date(latest.test_date) ? current : latest;
    }, tests[0]);

    if (
      tank.optimal_salinity_min !== undefined && 
      tank.optimal_salinity_max !== undefined &&
      (latestTest.salinity_ppt < tank.optimal_salinity_min || latestTest.salinity_ppt > tank.optimal_salinity_max)
    ) {
      alerts.push({
        tank,
        parameter: 'Salinity',
        current: latestTest.salinity_ppt,
        optimal: `${tank.optimal_salinity_min} - ${tank.optimal_salinity_max} ppt`,
        level: latestTest.salinity_ppt < tank.optimal_salinity_min - 2 || latestTest.salinity_ppt > tank.optimal_salinity_max + 2 ? 'danger' : 'warning'
      });
    }

    if (
      tank.optimal_temp_min !== undefined && 
      tank.optimal_temp_max !== undefined &&
      (latestTest.temperature_c < tank.optimal_temp_min || latestTest.temperature_c > tank.optimal_temp_max)
    ) {
      alerts.push({
        tank,
        parameter: 'Temperature',
        current: latestTest.temperature_c,
        optimal: `${tank.optimal_temp_min} - ${tank.optimal_temp_max} °C`,
        level: latestTest.temperature_c < tank.optimal_temp_min - 1.5 || latestTest.temperature_c > tank.optimal_temp_max + 1.5 ? 'danger' : 'warning'
      });
    }

    if (
      tank.optimal_ph_min !== undefined && 
      tank.optimal_ph_max !== undefined &&
      (latestTest.ph < tank.optimal_ph_min || latestTest.ph > tank.optimal_ph_max)
    ) {
      alerts.push({
        tank,
        parameter: 'pH',
        current: latestTest.ph,
        optimal: `${tank.optimal_ph_min} - ${tank.optimal_ph_max}`,
        level: latestTest.ph < tank.optimal_ph_min - 0.4 || latestTest.ph > tank.optimal_ph_max + 0.4 ? 'danger' : 'warning'
      });
    }

    // Ammonia alert (> 0.5 ppm is dangerous for crabs)
    if (latestTest.ammonia_ppm > 0.5) {
      alerts.push({
        tank,
        parameter: 'Ammonia',
        current: latestTest.ammonia_ppm,
        optimal: '< 0.5 ppm',
        level: latestTest.ammonia_ppm > 1.0 ? 'danger' : 'warning'
      });
    }
  });

  // Calculate dosing records logged today
  const todayStr = new Date().toISOString().split('T')[0];
  const dosesToday = initialChemicalHistory.filter(h => h.event_date === todayStr).length;

  // Prepare chart data
  const filteredTests = selectedTankId === 'all' 
    ? initialWaterTests 
    : initialWaterTests.filter(t => t.tank_id === selectedTankId);

  // Group and sort chart data by date (up to 10 points)
  const chartData = [...filteredTests]
    .sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())
    .slice(-10)
    .map(t => ({
      date: new Date(t.test_date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      salinity: t.salinity_ppt,
      temp: t.temperature_c,
      ph: t.ph,
      ammonia: t.ammonia_ppm,
      tank: t.tank_name
    }));

  return (
    <div className="space-y-6">
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tanks */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Tanks</span>
            <h3 className="text-3xl font-extrabold tracking-tight">{totalTanks}</h3>
            <p className="text-xs text-slate-400">Monitored enclosures</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Waves className="h-6 w-6" />
          </div>
        </div>

        {/* Species Stocked */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monitored Species</span>
            <h3 className="text-3xl font-extrabold tracking-tight">{totalSpecies}</h3>
            <p className="text-xs text-slate-400">With optimal ranges</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Active Alerts */}
        <div className={`glass-card p-6 flex items-center justify-between border-l-4 ${alerts.length > 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Alerts</span>
            <h3 className={`text-3xl font-extrabold tracking-tight ${alerts.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {alerts.length}
            </h3>
            <p className="text-xs text-slate-400">Requires attention</p>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${alerts.length > 0 ? 'bg-red-500/10 text-red-500 animate-bounce' : 'bg-emerald-500/10 text-emerald-500'}`}>
            {alerts.length > 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle className="h-6 w-6" />}
          </div>
        </div>

        {/* Doses Logged Today */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Doses Today</span>
            <h3 className="text-3xl font-extrabold tracking-tight">{dosesToday}</h3>
            <p className="text-xs text-slate-400">Chemical treatments</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <FlaskConical className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Alert Banner / Details Panel */}
      {alerts.length > 0 && (
        <div className="bg-red-500/10 dark:bg-red-950/20 border border-red-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">Critical Water Quality Alerts ({alerts.length})</h4>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                {alerts.map((a, i) => (
                  <span key={i} className="inline-block mr-4">
                    • <strong>{a.tank.name}</strong>: {a.parameter} is {a.current} (optimal: {a.optimal})
                  </span>
                ))}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link 
              href="/chemical-dosing" 
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Dose Tank</span>
            </Link>
          </div>
        </div>
      )}

      {/* Charts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span>Water Parameter History</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Water chemistry trend analysis</p>
            </div>
            
            {/* Tank Filter Selection */}
            <select
              value={selectedTankId}
              onChange={(e) => setSelectedTankId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="all">All Tanks (Merged)</option>
              {initialTanks.map(tank => (
                <option key={tank.id} value={tank.id}>{tank.name}</option>
              ))}
            </select>
          </div>

          <div className="h-72 w-full pt-2">
            {mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="salinity" orientation="left" tick={{ fontSize: 10 }} label={{ value: 'Salinity (ppt)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#0ea5e9' } }} />
                  <YAxis yAxisId="ph" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'pH', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#f97316' } }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line yAxisId="salinity" type="monotone" dataKey="salinity" stroke="#0ea5e9" name="Salinity (ppt)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line yAxisId="ph" type="monotone" dataKey="ph" stroke="#f97316" name="pH" strokeWidth={2} />
                  <Line yAxisId="ph" type="monotone" dataKey="temp" stroke="#22c55e" name="Temp (°C)" strokeWidth={1.5} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <span>No water test logs available.</span>
                <Link href="/water-records" className="text-xs text-primary hover:underline mt-2 flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Log First Reading
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800/85 text-sm uppercase tracking-wider">
            Quick Operations
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <Link 
              href="/water-records" 
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850 hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Record Water Test</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Log salinity, temp, pH, ammonia</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/salinity-calculator" 
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850 hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Salinity Adjuster</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Calculate salt doses or dilution</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/chemical-dosing" 
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850 hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Chemical Calculator</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Calculate pH buffering & biofloc dosing</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/reports" 
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850 hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Generate Reports</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Export water profiles and actions</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Readings Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/85">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-accent" />
              <span>Recent Water Quality Readings</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest 5 logged water quality audits</p>
          </div>
          <Link href="/water-records" className="text-xs font-semibold text-primary hover:underline">
            View All Logs
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Tank Name</th>
                <th className="py-3 px-4">Salinity (ppt)</th>
                <th className="py-3 px-4">Temp (°C)</th>
                <th className="py-3 px-4">pH</th>
                <th className="py-3 px-4">Ammonia (ppm)</th>
                <th className="py-3 px-4">Nitrite / Nitrate</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {initialWaterTests.slice(0, 5).map((log) => {
                // Find tank
                const tank = initialTanks.find(t => t.id === log.tank_id);
                
                // Salinity warning check
                const isSalinityAlert = tank && 
                  tank.optimal_salinity_min !== undefined && 
                  tank.optimal_salinity_max !== undefined &&
                  (log.salinity_ppt < tank.optimal_salinity_min || log.salinity_ppt > tank.optimal_salinity_max);
                
                // pH warning check
                const isPhAlert = tank && 
                  tank.optimal_ph_min !== undefined && 
                  tank.optimal_ph_max !== undefined &&
                  (log.ph < tank.optimal_ph_min || log.ph > tank.optimal_ph_max);

                // Ammonia warning check
                const isAmmoniaAlert = log.ammonia_ppm > 0.5;

                return (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium">{log.test_date}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{log.tank_name || `Tank #${log.tank_id}`}</td>
                    <td className={`py-3.5 px-4 font-bold ${isSalinityAlert ? 'text-red-500 bg-red-500/5' : 'text-slate-700 dark:text-slate-300'}`}>
                      {log.salinity_ppt} ppt
                    </td>
                    <td className="py-3.5 px-4">{log.temperature_c} °C</td>
                    <td className={`py-3.5 px-4 font-semibold ${isPhAlert ? 'text-red-500 bg-red-500/5' : ''}`}>{log.ph}</td>
                    <td className={`py-3.5 px-4 font-medium ${isAmmoniaAlert ? 'text-red-500 bg-red-500/5' : ''}`}>{log.ammonia_ppm}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {log.nitrite_ppm} / {log.nitrate_ppm} ppm
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-400 italic" title={log.notes || ''}>
                      {log.notes || '—'}
                    </td>
                  </tr>
                );
              })}
              {initialWaterTests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No recent readings logged. Go to "Water Quality Records" to log some data.
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
