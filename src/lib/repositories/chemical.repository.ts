import { getDatabase } from '../database/database';

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

export const ChemicalRepository = {
  getAllChemicalHistory(): ChemicalHistory[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT c.*, t.name as tank_name
      FROM chemical_history c
      JOIN tanks t ON c.tank_id = t.id
      ORDER BY c.event_date DESC, c.created_at DESC
    `).all() as ChemicalHistory[];
  },

  getChemicalHistoryForTank(tankId: number): ChemicalHistory[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT c.*, t.name as tank_name
      FROM chemical_history c
      JOIN tanks t ON c.tank_id = t.id
      WHERE c.tank_id = ?
      ORDER BY c.event_date DESC, c.created_at DESC
    `).all(tankId) as ChemicalHistory[];
  },

  insertChemicalHistory(history: Omit<ChemicalHistory, 'id' | 'created_at'>): number | bigint {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO chemical_history (tank_id, event_date, chemical_name, amount_grams, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      history.tank_id,
      history.event_date,
      history.chemical_name,
      history.amount_grams,
      history.reason
    );
    return result.lastInsertRowid;
  },

  deleteChemicalHistory(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM chemical_history WHERE id = ?').run(id);
    return result.changes > 0;
  }
};
