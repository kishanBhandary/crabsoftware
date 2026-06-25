import { getDatabase } from '../database/database';

export const SettingsRepository = {
  getSetting(key: string): string | undefined {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row?.value;
  },

  updateSetting(key: string, value: string): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
  },

  getAllSettings(): Record<string, string> {
    const db = getDatabase();
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }
};
