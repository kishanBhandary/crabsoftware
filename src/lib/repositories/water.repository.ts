import { getDatabase } from '../database/database';

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

export const WaterRepository = {
  getAllWaterTests(): WaterTest[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT w.*, t.name as tank_name
      FROM water_tests w
      JOIN tanks t ON w.tank_id = t.id
      ORDER BY w.test_date DESC, w.created_at DESC
    `).all() as WaterTest[];
  },

  getWaterTestsForTank(tankId: number): WaterTest[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT w.*, t.name as tank_name
      FROM water_tests w
      JOIN tanks t ON w.tank_id = t.id
      WHERE w.tank_id = ?
      ORDER BY w.test_date DESC, w.created_at DESC
    `).all(tankId) as WaterTest[];
  },

  getLatestWaterTestForTank(tankId: number): WaterTest | undefined {
    const db = getDatabase();
    return db.prepare(`
      SELECT w.*, t.name as tank_name
      FROM water_tests w
      JOIN tanks t ON w.tank_id = t.id
      WHERE w.tank_id = ?
      ORDER BY w.test_date DESC, w.created_at DESC
      LIMIT 1
    `).get(tankId) as WaterTest | undefined;
  },

  insertWaterTest(test: Omit<WaterTest, 'id' | 'created_at'>): number | bigint {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO water_tests (tank_id, test_date, salinity_ppt, temperature_c, ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      test.tank_id,
      test.test_date,
      test.salinity_ppt,
      test.temperature_c,
      test.ph,
      test.ammonia_ppm,
      test.nitrite_ppm,
      test.nitrate_ppm,
      test.notes
    );
    return result.lastInsertRowid;
  },

  deleteWaterTest(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM water_tests WHERE id = ?').run(id);
    return result.changes > 0;
  }
};
