'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Waves, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Bookmark, 
  Info, 
  X,
  Droplet,
  Thermometer,
  Eye
} from 'lucide-react';
import { Tank, Species } from '@/lib/types';
import { createTank, updateTank, deleteTank, createSpecies } from '@/lib/actions';

// Zod Validation Schemas
const tankSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  volume_liters: z.preprocess((val) => Number(val), z.number().positive('Volume must be a positive number')),
  species_id: z.preprocess((val) => val === '' ? null : Number(val), z.number().nullable()),
  notes: z.string().max(500, 'Notes must be less than 500 characters').nullable().default(''),
});

const speciesSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  scientific_name: z.string().min(2, 'Scientific name is required').nullable(),
  optimal_salinity_min: z.preprocess((val) => Number(val), z.number().min(0).max(100)),
  optimal_salinity_max: z.preprocess((val) => Number(val), z.number().min(0).max(100)),
  optimal_temp_min: z.preprocess((val) => Number(val), z.number().min(0).max(50)),
  optimal_temp_max: z.preprocess((val) => Number(val), z.number().min(0).max(50)),
  optimal_ph_min: z.preprocess((val) => Number(val), z.number().min(0).max(14)),
  optimal_ph_max: z.preprocess((val) => Number(val), z.number().min(0).max(14)),
  notes: z.string().nullable().default(''),
});

interface TankFormInput {
  name: string;
  volume_liters: number;
  species_id: number | null;
  notes: string;
}

interface SpeciesFormInput {
  name: string;
  scientific_name: string;
  optimal_salinity_min: number;
  optimal_salinity_max: number;
  optimal_temp_min: number;
  optimal_temp_max: number;
  optimal_ph_min: number;
  optimal_ph_max: number;
  notes: string;
}

interface TankContentProps {
  initialTanks: Tank[];
  speciesList: Species[];
}

export default function TankContent({ initialTanks, speciesList }: TankContentProps) {
  const [tanks, setTanks] = useState<Tank[]>(initialTanks);
  const [species, setSpecies] = useState<Species[]>(speciesList);
  
  // Modals state
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [editingTank, setEditingTank] = useState<Tank | null>(null);

  // React Hook Form for Tank
  const {
    register: registerTank,
    handleSubmit: handleSubmitTank,
    reset: resetTank,
    setValue: setTankValue,
    formState: { errors: tankErrors, isSubmitting: isTankSubmitting },
  } = useForm<TankFormInput>({
    resolver: zodResolver(tankSchema) as any,
    defaultValues: { name: '', volume_liters: 1000, species_id: null, notes: '' },
  });

  // React Hook Form for Species
  const {
    register: registerSpecies,
    handleSubmit: handleSubmitSpecies,
    reset: resetSpecies,
    formState: { errors: speciesErrors, isSubmitting: isSpeciesSubmitting },
  } = useForm<SpeciesFormInput>({
    resolver: zodResolver(speciesSchema) as any,
    defaultValues: {
      name: '',
      scientific_name: '',
      optimal_salinity_min: 15,
      optimal_salinity_max: 25,
      optimal_temp_min: 26,
      optimal_temp_max: 30,
      optimal_ph_min: 7.5,
      optimal_ph_max: 8.5,
      notes: '',
    },
  });

  // Open Add Tank Modal
  const handleOpenAddTank = () => {
    setEditingTank(null);
    resetTank({ name: '', volume_liters: 1000, species_id: species[0]?.id || null, notes: '' });
    setIsTankModalOpen(true);
  };

  // Open Edit Tank Modal
  const handleOpenEditTank = (tank: Tank) => {
    setEditingTank(tank);
    resetTank({
      name: tank.name,
      volume_liters: tank.volume_liters,
      species_id: tank.species_id,
      notes: tank.notes || '',
    });
    setIsTankModalOpen(true);
  };

  // Handle Tank Form Submit (Add/Edit)
  const onTankSubmit = async (values: TankFormInput) => {
    if (editingTank) {
      // Update
      const res = await updateTank(editingTank.id, values);
      if (res.success) {
        setTanks(prev =>
          prev.map(t =>
            t.id === editingTank.id
              ? {
                  ...t,
                  ...values,
                  species_name: species.find(s => s.id === values.species_id)?.name || undefined,
                  optimal_salinity_min: species.find(s => s.id === values.species_id)?.optimal_salinity_min,
                  optimal_salinity_max: species.find(s => s.id === values.species_id)?.optimal_salinity_max,
                  optimal_temp_min: species.find(s => s.id === values.species_id)?.optimal_temp_min,
                  optimal_temp_max: species.find(s => s.id === values.species_id)?.optimal_temp_max,
                  optimal_ph_min: species.find(s => s.id === values.species_id)?.optimal_ph_min,
                  optimal_ph_max: species.find(s => s.id === values.species_id)?.optimal_ph_max,
                }
              : t
          )
        );
        setIsTankModalOpen(false);
      } else {
        alert(res.error || 'Failed to update tank');
      }
    } else {
      // Create
      const res = await createTank(values);
      if (res.success && res.id) {
        const newTank: Tank = {
          id: Number(res.id),
          name: values.name,
          volume_liters: values.volume_liters,
          species_id: values.species_id,
          notes: values.notes,
          created_at: new Date().toISOString().split('T')[0],
          species_name: species.find(s => s.id === values.species_id)?.name || undefined,
          optimal_salinity_min: species.find(s => s.id === values.species_id)?.optimal_salinity_min,
          optimal_salinity_max: species.find(s => s.id === values.species_id)?.optimal_salinity_max,
          optimal_temp_min: species.find(s => s.id === values.species_id)?.optimal_temp_min,
          optimal_temp_max: species.find(s => s.id === values.species_id)?.optimal_temp_max,
          optimal_ph_min: species.find(s => s.id === values.species_id)?.optimal_ph_min,
          optimal_ph_max: species.find(s => s.id === values.species_id)?.optimal_ph_max,
        };
        setTanks(prev => [newTank, ...prev]);
        setIsTankModalOpen(false);
      } else {
        alert(res.error || 'Failed to create tank');
      }
    }
  };

  // Handle Tank Delete
  const handleDeleteTank = async (id: number) => {
    if (confirm('Are you sure you want to delete this tank? This will delete all water tests and dosing history for this tank.')) {
      const res = await deleteTank(id);
      if (res.success) {
        setTanks(prev => prev.filter(t => t.id !== id));
      } else {
        alert(res.error || 'Failed to delete tank');
      }
    }
  };

  // Handle Species Form Submit
  const onSpeciesSubmit = async (values: SpeciesFormInput) => {
    const res = await createSpecies(values);
    if (res.success && res.id) {
      const newSpecies: Species = {
        id: Number(res.id),
        ...values,
      };
      setSpecies(prev => [...prev, newSpecies]);
      setIsSpeciesModalOpen(false);
      resetSpecies();
    } else {
      alert(res.error || 'Failed to create species');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Waves className="h-5 w-5 text-primary" />
            <span>Monitored Aquacultural Enclosures</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage tanks, volume specs, and stocked crab species parameters</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSpeciesModalOpen(true)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/40 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Bookmark className="h-4 w-4" />
            <span>Add Species Specs</span>
          </button>

          <button
            onClick={handleOpenAddTank}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-primary/10"
          >
            <Plus className="h-4 w-4" />
            <span>New Tank</span>
          </button>
        </div>
      </div>

      {/* Tanks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tanks.map((tank) => (
          <div key={tank.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4 relative border border-slate-200/60 dark:border-slate-800/60">
            {/* Upper Section */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{tank.name}</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {tank.species_name || 'Unstocked'}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-slate-500 dark:text-slate-400">
                  {tank.volume_liters.toLocaleString()} L
                </span>
              </div>

              {/* Optimal Guidelines */}
              {tank.species_id && (
                <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-2 border border-slate-200/30 dark:border-slate-800/40">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                    Optimal Chemistry Ranges
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 bg-sky-500/5 rounded-lg border border-sky-500/10">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-sky-500 font-semibold mb-0.5">
                        <Droplet className="h-3 w-3" />
                        <span>Salinity</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {tank.optimal_salinity_min}-{tank.optimal_salinity_max}
                      </span>
                      <span className="text-[9px] text-slate-400 block">ppt</span>
                    </div>

                    <div className="p-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-500 font-semibold mb-0.5">
                        <Thermometer className="h-3 w-3" />
                        <span>Temp</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {tank.optimal_temp_min}-{tank.optimal_temp_max}
                      </span>
                      <span className="text-[9px] text-slate-400 block">°C</span>
                    </div>

                    <div className="p-1.5 bg-amber-500/5 rounded-lg border border-amber-500/10">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-amber-500 font-semibold mb-0.5">
                        <Info className="h-3 w-3" />
                        <span>pH</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {tank.optimal_ph_min}-{tank.optimal_ph_max}
                      </span>
                      <span className="text-[9px] text-slate-400 block">pH</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tank Notes */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 line-clamp-3 italic">
                {tank.notes || 'No description notes.'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                Added: {tank.created_at}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditTank(tank)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title="Edit Tank"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTank(tank.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  title="Delete Tank"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {tanks.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white/20 dark:bg-black/10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Waves className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No tanks configured</h3>
            <p className="text-xs text-slate-400 mt-1">Get started by creating your first aquaculture enclosure.</p>
            <button
              onClick={handleOpenAddTank}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover shadow"
            >
              Configure Enclosure
            </button>
          </div>
        )}
      </div>

      {/* Tank Dialog Modal */}
      {isTankModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-850 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {editingTank ? `Edit Enclosure Settings: ${editingTank.name}` : 'Setup New Enclosure'}
              </h3>
              <button 
                onClick={() => setIsTankModalOpen(false)} 
                className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTank(onTankSubmit)} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tank Identifier / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nursery Tank B"
                  className="form-input text-sm"
                  {...registerTank('name')}
                />
                {tankErrors.name && <p className="text-xs text-red-500 font-medium">{tankErrors.name.message}</p>}
              </div>

              {/* Volume & Species */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Volume Capacity (Liters)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input text-sm"
                    {...registerTank('volume_liters')}
                  />
                  {tankErrors.volume_liters && <p className="text-xs text-red-500 font-medium">{tankErrors.volume_liters.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Species Stocked</label>
                  <select
                    className="form-input text-sm"
                    {...registerTank('species_id')}
                  >
                    <option value="">Unstocked (No Species Guidelines)</option>
                    {species.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.scientific_name})</option>
                    ))}
                  </select>
                  {tankErrors.species_id && <p className="text-xs text-red-500 font-medium">{tankErrors.species_id.message}</p>}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes / Enclosure Comments</label>
                <textarea
                  placeholder="Notes about filtration, stocking date, feed regimes, etc."
                  rows={3}
                  className="form-input text-sm resize-none"
                  {...registerTank('notes')}
                />
                {tankErrors.notes && <p className="text-xs text-red-500 font-medium">{tankErrors.notes.message}</p>}
              </div>

              {/* Form buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTankModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTankSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-all"
                >
                  {isTankSubmitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Species Dialog Modal */}
      {isSpeciesModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-850 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                Register New Species Guidelines
              </h3>
              <button 
                onClick={() => setIsSpeciesModalOpen(false)} 
                className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSpecies(onSpeciesSubmit)} className="p-5 space-y-4">
              {/* Species Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Common Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mangrove Crab"
                    className="form-input text-sm"
                    {...registerSpecies('name')}
                  />
                  {speciesErrors.name && <p className="text-xs text-red-500 font-medium">{speciesErrors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Scientific Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Scylla olivacea"
                    className="form-input text-sm"
                    {...registerSpecies('scientific_name')}
                  />
                  {speciesErrors.scientific_name && <p className="text-xs text-red-500 font-medium">{speciesErrors.scientific_name.message}</p>}
                </div>
              </div>

              {/* Param Bounds Grid */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/30 dark:border-slate-800/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Parameter Thresholds</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Salinity */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Salinity (ppt)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Min"
                        className="form-input text-xs"
                        {...registerSpecies('optimal_salinity_min')}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Max"
                        className="form-input text-xs"
                        {...registerSpecies('optimal_salinity_max')}
                      />
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Temp (°C)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Min"
                        className="form-input text-xs"
                        {...registerSpecies('optimal_temp_min')}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Max"
                        className="form-input text-xs"
                        {...registerSpecies('optimal_temp_max')}
                      />
                    </div>
                  </div>

                  {/* pH */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">pH Units</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Min"
                        className="form-input text-xs"
                        {...registerSpecies('optimal_ph_min')}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Max"
                        className="form-input text-xs"
                        {...registerSpecies('optimal_ph_max')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Stocking/Breeding Notes</label>
                <textarea
                  placeholder="Optimal environmental notes, feed rates, behavior flags..."
                  rows={2}
                  className="form-input text-sm resize-none"
                  {...registerSpecies('notes')}
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSpeciesModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSpeciesSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-all"
                >
                  {isSpeciesSubmitting ? 'Registering...' : 'Register Species'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
