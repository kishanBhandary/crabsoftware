'use server';

import { TankRepository, Tank, Species } from './repositories/tank.repository';
import { WaterRepository, WaterTest } from './repositories/water.repository';
import { ChemicalRepository, ChemicalHistory } from './repositories/chemical.repository';
import { ReportRepository, Report } from './repositories/report.repository';
import { SettingsRepository } from './repositories/settings.repository';
import { revalidatePath } from 'next/cache';

// Tank Actions
export async function getTanks(): Promise<Tank[]> {
  try {
    return TankRepository.getAllTanks();
  } catch (error) {
    console.error('Failed to fetch tanks:', error);
    return [];
  }
}

export async function getTank(id: number): Promise<Tank | undefined> {
  try {
    return TankRepository.getTank(id);
  } catch (error) {
    console.error(`Failed to fetch tank ${id}:`, error);
    return undefined;
  }
}

export async function createTank(data: {
  name: string;
  volume_liters: number;
  species_id: number | null;
  notes: string | null;
}): Promise<{ success: boolean; id?: number | bigint; error?: string }> {
  try {
    const id = TankRepository.insertTank(data.name, data.volume_liters, data.species_id, data.notes);
    revalidatePath('/');
    return { success: true, id };
  } catch (error: any) {
    console.error('Failed to create tank:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function updateTank(
  id: number,
  data: {
    name: string;
    volume_liters: number;
    species_id: number | null;
    notes: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = TankRepository.updateTank(id, data.name, data.volume_liters, data.species_id, data.notes);
    revalidatePath('/');
    return { success };
  } catch (error: any) {
    console.error(`Failed to update tank ${id}:`, error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function deleteTank(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const success = TankRepository.deleteTank(id);
    revalidatePath('/');
    return { success };
  } catch (error: any) {
    console.error(`Failed to delete tank ${id}:`, error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function getSpecies(): Promise<Species[]> {
  try {
    return TankRepository.getAllSpecies();
  } catch (error) {
    console.error('Failed to fetch species:', error);
    return [];
  }
}

export async function createSpecies(data: Omit<Species, 'id'>): Promise<{ success: boolean; id?: number | bigint; error?: string }> {
  try {
    const id = TankRepository.insertSpecies(data);
    revalidatePath('/');
    return { success: true, id };
  } catch (error: any) {
    console.error('Failed to create species:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// Water Test Actions
export async function getWaterTests(tankId?: number): Promise<WaterTest[]> {
  try {
    if (tankId !== undefined) {
      return WaterRepository.getWaterTestsForTank(tankId);
    }
    return WaterRepository.getAllWaterTests();
  } catch (error) {
    console.error('Failed to fetch water tests:', error);
    return [];
  }
}

export async function getLatestWaterTest(tankId: number): Promise<WaterTest | undefined> {
  try {
    return WaterRepository.getLatestWaterTestForTank(tankId);
  } catch (error) {
    console.error(`Failed to fetch latest water test for tank ${tankId}:`, error);
    return undefined;
  }
}

export async function createWaterTest(data: Omit<WaterTest, 'id' | 'created_at'>): Promise<{ success: boolean; id?: number | bigint; error?: string }> {
  try {
    const id = WaterRepository.insertWaterTest(data);
    revalidatePath('/');
    return { success: true, id };
  } catch (error: any) {
    console.error('Failed to create water test:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function deleteWaterTest(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const success = WaterRepository.deleteWaterTest(id);
    revalidatePath('/');
    return { success };
  } catch (error: any) {
    console.error(`Failed to delete water test ${id}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// Chemical History Actions
export async function getChemicalHistories(tankId?: number): Promise<ChemicalHistory[]> {
  try {
    if (tankId !== undefined) {
      return ChemicalRepository.getChemicalHistoryForTank(tankId);
    }
    return ChemicalRepository.getAllChemicalHistory();
  } catch (error) {
    console.error('Failed to fetch chemical history:', error);
    return [];
  }
}

export async function createChemicalHistory(data: Omit<ChemicalHistory, 'id' | 'created_at'>): Promise<{ success: boolean; id?: number | bigint; error?: string }> {
  try {
    const id = ChemicalRepository.insertChemicalHistory(data);
    revalidatePath('/');
    return { success: true, id };
  } catch (error: any) {
    console.error('Failed to record chemical dose:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function deleteChemicalHistory(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const success = ChemicalRepository.deleteChemicalHistory(id);
    revalidatePath('/');
    return { success };
  } catch (error: any) {
    console.error(`Failed to delete chemical log ${id}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// Report Actions
export async function getReports(): Promise<Report[]> {
  try {
    return ReportRepository.getAllReports();
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return [];
  }
}

export async function createReport(data: Omit<Report, 'id' | 'generated_at'>): Promise<{ success: boolean; id?: number | bigint; error?: string }> {
  try {
    const id = ReportRepository.insertReport(data);
    revalidatePath('/');
    return { success: true, id };
  } catch (error: any) {
    console.error('Failed to create report entry:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function deleteReport(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const success = ReportRepository.deleteReport(id);
    revalidatePath('/');
    return { success };
  } catch (error: any) {
    console.error(`Failed to delete report ${id}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// Settings Actions
export async function getSettings(): Promise<Record<string, string>> {
  try {
    return SettingsRepository.getAllSettings();
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return {};
  }
}

export async function updateSetting(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  try {
    SettingsRepository.updateSetting(key, value);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to update setting ${key}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// Database backup action
import * as fs from 'fs';
import * as path from 'path';

export async function backupDatabase(): Promise<{ success: boolean; filepath?: string; error?: string }> {
  try {
    let dbDir: string;
    if (process.env.USER_DATA_PATH) {
      dbDir = process.env.USER_DATA_PATH;
    } else {
      dbDir = path.join(process.cwd(), 'database');
    }

    const sourcePath = path.join(dbDir, 'crabshack.db');
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: 'Database file not found.' };
    }

    const backupDir = path.join(dbDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `crabshack_backup_${timestamp}.db`;
    const destPath = path.join(backupDir, backupFilename);

    fs.copyFileSync(sourcePath, destPath);
    return { success: true, filepath: destPath };
  } catch (error: any) {
    console.error('Database backup failed:', error);
    return { success: false, error: error.message || 'Unknown backup error' };
  }
}
