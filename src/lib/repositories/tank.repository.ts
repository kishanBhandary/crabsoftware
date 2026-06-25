import { getDatabase } from '../database/database';

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

export const TankRepository = {
  getAllTanks(): Tank[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT t.*, s.name as species_name, 
             s.optimal_salinity_min, s.optimal_salinity_max,
             s.optimal_temp_min, s.optimal_temp_max,
             s.optimal_ph_min, s.optimal_ph_max
      FROM tanks t
      LEFT JOIN species s ON t.species_id = s.id
      ORDER BY t.created_at DESC
    `).all() as Tank[];
  },

  getTank(id: number): Tank | undefined {
    const db = getDatabase();
    return db.prepare(`
      SELECT t.*, s.name as species_name,
             s.optimal_salinity_min, s.optimal_salinity_max,
             s.optimal_temp_min, s.optimal_temp_max,
             s.optimal_ph_min, s.optimal_ph_max
      FROM tanks t
      LEFT JOIN species s ON t.species_id = s.id
      WHERE t.id = ?
    `).get(id) as Tank | undefined;
  },

  insertTank(name: string, volumeLiters: number, speciesId: number | null, notes: string | null): number | bigint {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO tanks (name, volume_liters, species_id, notes)
      VALUES (?, ?, ?, ?)
    `).run(name, volumeLiters, speciesId, notes);
    return result.lastInsertRowid;
  },

  updateTank(id: number, name: string, volumeLiters: number, speciesId: number | null, notes: string | null): boolean {
    const db = getDatabase();
    const result = db.prepare(`
      UPDATE tanks
      SET name = ?, volume_liters = ?, species_id = ?, notes = ?
      WHERE id = ?
    `).run(name, volumeLiters, speciesId, notes, id);
    return result.changes > 0;
  },

  deleteTank(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tanks WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getAllSpecies(): Species[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM species ORDER BY name ASC').all() as Species[];
  },

  getSpecies(id: number): Species | undefined {
    const db = getDatabase();
    return db.prepare('SELECT * FROM species WHERE id = ?').get(id) as Species | undefined;
  },
  
  insertSpecies(species: Omit<Species, 'id'>): number | bigint {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO species (name, scientific_name, optimal_salinity_min, optimal_salinity_max, optimal_temp_min, optimal_temp_max, optimal_ph_min, optimal_ph_max, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      species.name,
      species.scientific_name,
      species.optimal_salinity_min,
      species.optimal_salinity_max,
      species.optimal_temp_min,
      species.optimal_temp_max,
      species.optimal_ph_min,
      species.optimal_ph_max,
      species.notes
    );
    return result.lastInsertRowid;
  }
};
