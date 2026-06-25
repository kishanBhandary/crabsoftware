import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  // Resolve DB directory: use Electron's USER_DATA_PATH if injected, otherwise fallback to local
  let dbDir: string;
  if (process.env.USER_DATA_PATH) {
    dbDir = process.env.USER_DATA_PATH;
  } else {
    dbDir = path.join(process.cwd(), 'database');
  }

  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'crabshack.db');
  console.log(`[Database] Initializing SQLite connection at: ${dbPath}`);

  const db = new Database(dbPath, { verbose: console.log });
  db.pragma('journal_mode = WAL'); // Enable write-ahead logging for performance

  // Create tables if they do not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      scientific_name TEXT,
      optimal_salinity_min REAL NOT NULL,
      optimal_salinity_max REAL NOT NULL,
      optimal_temp_min REAL NOT NULL,
      optimal_temp_max REAL NOT NULL,
      optimal_ph_min REAL NOT NULL,
      optimal_ph_max REAL NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS tanks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      volume_liters REAL NOT NULL,
      species_id INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (species_id) REFERENCES species(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS water_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tank_id INTEGER NOT NULL,
      test_date TEXT NOT NULL,
      salinity_ppt REAL NOT NULL,
      temperature_c REAL NOT NULL,
      ph REAL NOT NULL,
      ammonia_ppm REAL DEFAULT 0,
      nitrite_ppm REAL DEFAULT 0,
      nitrate_ppm REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (tank_id) REFERENCES tanks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chemical_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tank_id INTEGER NOT NULL,
      event_date TEXT NOT NULL,
      chemical_name TEXT NOT NULL,
      amount_grams REAL NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (tank_id) REFERENCES tanks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      report_type TEXT NOT NULL,
      generated_at TEXT DEFAULT (datetime('now', 'localtime')),
      filepath TEXT,
      content_summary TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default data if species is empty
  const speciesCount = db.prepare('SELECT count(*) as count FROM species').get() as { count: number };
  if (speciesCount.count === 0) {
    console.log('[Database] Seeding default species metadata...');
    const insertSpecies = db.prepare(`
      INSERT INTO species (name, scientific_name, optimal_salinity_min, optimal_salinity_max, optimal_temp_min, optimal_temp_max, optimal_ph_min, optimal_ph_max, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSpecies.run('Mud Crab', 'Scylla serrata', 15.0, 25.0, 26.0, 30.0, 7.5, 8.5, 'Requires brackish water. High tolerance to salinity shifts but sensitive to cold temperature.');
    insertSpecies.run('Blue Swimmer Crab', 'Portunus armatus', 30.0, 35.0, 20.0, 28.0, 8.0, 8.4, 'Prefers higher salinity marine environments. Highly active swimmer.');
    insertSpecies.run('Soft Shell Crab (Mangrove)', 'Scylla olivacea', 10.0, 20.0, 25.0, 31.0, 7.2, 8.2, 'Ideal for molting tanks. Low lighting and stable salinity helps shedding process.');
  }

  // Seed settings if empty
  const settingsCount = db.prepare('SELECT count(*) as count FROM settings').get() as { count: number };
  if (settingsCount.count === 0) {
    console.log('[Database] Seeding default settings...');
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('temperature_unit', 'C');
    insertSetting.run('volume_unit', 'L');
    insertSetting.run('alert_notifications', 'true');
    insertSetting.run('auto_backup', 'false');
  }

  // Seed default tank if none exists
  const tankCount = db.prepare('SELECT count(*) as count FROM tanks').get() as { count: number };
  if (tankCount.count === 0) {
    console.log('[Database] Seeding default nursery tank...');
    const insertTank = db.prepare('INSERT INTO tanks (name, volume_liters, species_id, notes) VALUES (?, ?, ?, ?)');
    insertTank.run('Nursery Tank A', 1500.0, 1, 'Primary nursery for mud crab crablets.');
    insertTank.run('Grow-Out Pond 1', 10000.0, 1, 'Main mud crab grow-out system.');
    insertTank.run('Molting Facility 1', 500.0, 3, 'Individual cell soft-shell system.');
  }

  dbInstance = db;
  return db;
}
