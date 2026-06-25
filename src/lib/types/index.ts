export interface Species {
  id: number;
  name: string;
  scientific_name: string | null;
  optimal_salinity_min: number;
  optimal_salinity_max: number;
  optimal_temp_min: number;
  optimal_temp_max: number;
  optimal_ph_min: number;
  optimal_ph_max: number;
  notes: string | null;
}

export interface Tank {
  id: number;
  name: string;
  volume_liters: number;
  species_id: number | null;
  notes: string | null;
  created_at: string;
  species_name?: string;
  optimal_salinity_min?: number;
  optimal_salinity_max?: number;
  optimal_temp_min?: number;
  optimal_temp_max?: number;
  optimal_ph_min?: number;
  optimal_ph_max?: number;
}

export interface WaterTest {
  id: number;
  tank_id: number;
  test_date: string;
  salinity_ppt: number;
  temperature_c: number;
  ph: number;
  ammonia_ppm: number;
  nitrite_ppm: number;
  nitrate_ppm: number;
  notes: string | null;
  created_at: string;
  tank_name?: string;
}

export interface ChemicalHistory {
  id: number;
  tank_id: number;
  event_date: string;
  chemical_name: string;
  amount_grams: number;
  reason: string | null;
  created_at: string;
  tank_name?: string;
}

export interface Report {
  id: number;
  name: string;
  report_type: string;
  generated_at: string;
  filepath: string | null;
  content_summary: string | null;
}

export interface AppSettings {
  temperature_unit: 'C' | 'F';
  volume_unit: 'L' | 'Gal';
  alert_notifications: boolean;
  auto_backup: boolean;
}
