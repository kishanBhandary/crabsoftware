'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Filter, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Tank, WaterTest } from '@/lib/types';
import { createWaterTest, deleteWaterTest } from '@/lib/actions';

// Zod schema for water tests
const waterTestSchema = z.object({
  tank_id: z.preprocess((val) => Number(val), z.number().int().positive('Please select a valid tank')),
  test_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date'),
  salinity_ppt: z.preprocess((val) => Number(val), z.number().min(0).max(100, 'Salinity must be between 0 and 100')),
  temperature_c: z.preprocess((val) => Number(val), z.number().min(0).max(50, 'Temperature must be between 0 and 50')),
  ph: z.preprocess((val) => Number(val), z.number().min(0).max(14, 'pH must be between 0 and 14')),
  ammonia_ppm: z.preprocess((val) => Number(val), z.number().min(0).max(10).default(0)),
  nitrite_ppm: z.preprocess((val) => Number(val), z.number().min(0).max(10).default(0)),
  nitrate_ppm: z.preprocess((val) => Number(val), z.number().min(0).max(200).default(0)),
  notes: z.string().max(500, 'Notes must be less than 500 characters').nullable().default(''),
});

interface WaterTestFormInput {
  tank_id: number;
  test_date: string;
  salinity_ppt: number;
  temperature_c: number;
  ph: number;
  ammonia_ppm: number;
  nitrite_ppm: number;
  nitrate_ppm: number;
  notes: string;
}

interface WaterRecordsContentProps {
  tanks: Tank[];
  initialWaterTests: WaterTest[];
}

export default function WaterRecordsContent({ tanks, initialWaterTests }: WaterRecordsContentProps) {
  const [logs, setLogs] = useState<WaterTest[]>(initialWaterTests);
  const [filterTankId, setFilterTankId] = useState<number | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WaterTestFormInput>({
    resolver: zodResolver(waterTestSchema) as any,
    defaultValues: {
      tank_id: tanks[0]?.id || 1,
      test_date: new Date().toISOString().split('T')[0],
      salinity_ppt: 15,
      temperature_c: 28,
      ph: 8.0,
      ammonia_ppm: 0,
      nitrite_ppm: 0,
      nitrate_ppm: 0,
      notes: '',
    },
  });

  // Handle Form Submit
  const onFormSubmit = async (values: WaterTestFormInput) => {
    const res = await createWaterTest(values);
    if (res.success && res.id) {
      const targetTank = tanks.find(t => t.id === values.tank_id);
      const newLog: WaterTest = {
        id: Number(res.id),
        ...values,
        created_at: new Date().toISOString(),
        tank_name: targetTank?.name || `Tank #${values.tank_id}`
      };

      setLogs(prev => [newLog, ...prev]);
      setIsModalOpen(false);
      reset({
        tank_id: values.tank_id, // preserve selection
        test_date: new Date().toISOString().split('T')[0],
        salinity_ppt: values.salinity_ppt, // preserve values to ease double logs
        temperature_c: values.temperature_c,
        ph: values.ph,
        ammonia_ppm: 0,
        nitrite_ppm: 0,
        nitrate_ppm: 0,
        notes: '',
      });
      setSuccessMsg('Water test log recorded successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      alert(res.error || 'Failed to record water test log.');
    }
  };

  // Handle Log Delete
  const handleDeleteLog = async (id: number) => {
    if (confirm('Are you sure you want to delete this water quality record?')) {
      const res = await deleteWaterTest(id);
      if (res.success) {
        setLogs(prev => prev.filter(l => l.id !== id));
      } else {
        alert(res.error || 'Failed to delete record.');
      }
    }
  };

  // Filter logs list
  const filteredLogs = filterTankId === 'all'
    ? logs
    : logs.filter(l => l.tank_id === filterTankId);

  return (
    <div className="space-y-6">
      {/* Upper header action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span>Water Quality Records</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Audit history log of biological, saline, and chemical parameters</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          <span>Record Water Test</span>
        </button>
      </div>

      {/* Alert toast */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filtering Options */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by Enclosure:</span>
          <select
            value={filterTankId}
            onChange={(e) => setFilterTankId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Tanks / Ponds</option>
            {tanks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Found {filteredLogs.length} matching readings
        </span>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-black/10">
                <th className="py-3 px-4">Test Date</th>
                <th className="py-3 px-4">Tank / pond</th>
                <th className="py-3 px-4">Salinity</th>
                <th className="py-3 px-4">Temp</th>
                <th className="py-3 px-4">pH</th>
                <th className="py-3 px-4">Ammonia (NH3)</th>
                <th className="py-3 px-4">Nitrite (NO2)</th>
                <th className="py-3 px-4">Nitrate (NO3)</th>
                <th className="py-3 px-4">Notes / Remarks</th>
                <th className="py-3 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                // Find matching tank to check optimal ranges
                const tank = tanks.find(t => t.id === log.tank_id);
                
                const isSalinityAlert = tank && 
                  tank.optimal_salinity_min !== undefined && 
                  tank.optimal_salinity_max !== undefined &&
                  (log.salinity_ppt < tank.optimal_salinity_min || log.salinity_ppt > tank.optimal_salinity_max);

                const isTempAlert = tank && 
                  tank.optimal_temp_min !== undefined && 
                  tank.optimal_temp_max !== undefined &&
                  (log.temperature_c < tank.optimal_temp_min || log.temperature_c > tank.optimal_temp_max);

                const isPhAlert = tank && 
                  tank.optimal_ph_min !== undefined && 
                  tank.optimal_ph_max !== undefined &&
                  (log.ph < tank.optimal_ph_min || log.ph > tank.optimal_ph_max);

                const isAmmoniaAlert = log.ammonia_ppm > 0.5;
                const isNitriteAlert = log.nitrite_ppm > 1.0;

                return (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-350">{log.test_date}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-200">{log.tank_name || `Tank #${log.tank_id}`}</td>
                    
                    {/* Salinity cell */}
                    <td className={`py-3.5 px-4 font-bold ${isSalinityAlert ? 'text-red-500 bg-red-500/5' : 'text-slate-700 dark:text-slate-300'}`}>
                      <div className="flex items-center gap-1">
                        {isSalinityAlert && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        <span>{log.salinity_ppt} ppt</span>
                      </div>
                    </td>

                    {/* Temp cell */}
                    <td className={`py-3.5 px-4 font-bold ${isTempAlert ? 'text-red-500 bg-red-500/5' : 'text-slate-700 dark:text-slate-300'}`}>
                      <div className="flex items-center gap-1">
                        {isTempAlert && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        <span>{log.temperature_c} °C</span>
                      </div>
                    </td>

                    {/* pH cell */}
                    <td className={`py-3.5 px-4 font-bold ${isPhAlert ? 'text-red-500 bg-red-500/5' : 'text-slate-700 dark:text-slate-300'}`}>
                      <div className="flex items-center gap-1">
                        {isPhAlert && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        <span>{log.ph}</span>
                      </div>
                    </td>

                    {/* Ammonia cell */}
                    <td className={`py-3.5 px-4 font-semibold ${isAmmoniaAlert ? 'text-red-500 bg-red-500/5' : ''}`}>
                      {log.ammonia_ppm} ppm
                    </td>

                    {/* Nitrite cell */}
                    <td className={`py-3.5 px-4 ${isNitriteAlert ? 'text-red-500 bg-red-500/5' : ''}`}>
                      {log.nitrite_ppm} ppm
                    </td>

                    {/* Nitrate cell */}
                    <td className="py-3.5 px-4">{log.nitrate_ppm} ppm</td>
                    
                    {/* Notes */}
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-450 italic" title={log.notes || ''}>
                      {log.notes || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                    No readings matches the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Water Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-850 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                Log Water Quality Test Result
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="p-5 space-y-4">
              {/* Tank and Date selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Tank</label>
                  <select
                    className="form-input text-sm font-semibold"
                    {...register('tank_id')}
                  >
                    {tanks.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.species_name || 'Unstocked'})</option>
                    ))}
                  </select>
                  {errors.tank_id && <p className="text-xs text-red-500 font-medium">{errors.tank_id.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Test Date</label>
                  <input
                    type="date"
                    className="form-input text-sm font-semibold"
                    {...register('test_date')}
                  />
                  {errors.test_date && <p className="text-xs text-red-500 font-medium">{errors.test_date.message}</p>}
                </div>
              </div>

              {/* Physical/Saline parameters */}
              <div className="p-4 bg-slate-55/20 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-3">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Physical Properties</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Salinity (ppt)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input text-xs font-semibold"
                      {...register('salinity_ppt')}
                    />
                    {errors.salinity_ppt && <p className="text-xs text-red-500 font-medium">{errors.salinity_ppt.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Temperature (°C)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input text-xs font-semibold"
                      {...register('temperature_c')}
                    />
                    {errors.temperature_c && <p className="text-xs text-red-500 font-medium">{errors.temperature_c.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">pH Level</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input text-xs font-semibold"
                      {...register('ph')}
                    />
                    {errors.ph && <p className="text-xs text-red-500 font-medium">{errors.ph.message}</p>}
                  </div>
                </div>
              </div>

              {/* Chemical Nitrogens */}
              <div className="p-4 bg-slate-55/20 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-3">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Nitrogen Nutrients (ppm)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Ammonia (NH3-N)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input text-xs font-semibold"
                      {...register('ammonia_ppm')}
                    />
                    {errors.ammonia_ppm && <p className="text-xs text-red-500 font-medium">{errors.ammonia_ppm.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nitrite (NO2-N)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input text-xs font-semibold"
                      {...register('nitrite_ppm')}
                    />
                    {errors.nitrite_ppm && <p className="text-xs text-red-500 font-medium">{errors.nitrite_ppm.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nitrate (NO3-N)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input text-xs font-semibold"
                      {...register('nitrate_ppm')}
                    />
                    {errors.nitrate_ppm && <p className="text-xs text-red-500 font-medium">{errors.nitrate_ppm.message}</p>}
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Remarks / Log Notes</label>
                <textarea
                  placeholder="e.g. Clean water, observed normal crab feeding rates..."
                  rows={2}
                  className="form-input text-sm resize-none"
                  {...register('notes')}
                />
              </div>

              {/* Form buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Record Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
