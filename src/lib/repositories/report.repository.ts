import { getDatabase } from '../database/database';

export interface Report {
  id: number;
  name: string;
  report_type: string;
  generated_at: string;
  filepath: string | null;
  content_summary: string | null;
}

export const ReportRepository = {
  getAllReports(): Report[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM reports ORDER BY generated_at DESC').all() as Report[];
  },

  insertReport(report: Omit<Report, 'id' | 'generated_at'>): number | bigint {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO reports (name, report_type, filepath, content_summary)
      VALUES (?, ?, ?, ?)
    `).run(
      report.name,
      report.report_type,
      report.filepath,
      report.content_summary
    );
    return result.lastInsertRowid;
  },

  deleteReport(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM reports WHERE id = ?').run(id);
    return result.changes > 0;
  }
};
