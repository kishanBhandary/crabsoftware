'use client';

import React, { useState } from 'react';
import { FileBarChart2, Calendar, FileText, Download, Trash2, CheckCircle2 } from 'lucide-react';
import { Tank, WaterTest, ChemicalHistory, Report } from '@/lib/types';
import { createReport, deleteReport } from '@/lib/actions';

interface ReportsContentProps {
  tanks: Tank[];
  waterTests: WaterTest[];
  chemicalHistory: ChemicalHistory[];
  initialReports: Report[];
}

export default function ReportsContent({
  tanks,
  waterTests,
  chemicalHistory,
  initialReports,
}: ReportsContentProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [selectedTankId, setSelectedTankId] = useState<number | 'all'>('all');
  const [reportType, setReportType] = useState<'water' | 'chemical' | 'integrated'>('water');
  
  // Date ranges
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Generate Report and Trigger CSV Download
  const handleGenerateReport = async () => {
    // 1. Filter data based on inputs
    const tankName = selectedTankId === 'all' 
      ? 'All Tanks' 
      : tanks.find(t => t.id === selectedTankId)?.name || `Tank #${selectedTankId}`;

    let csvContent = '';
    let recordCount = 0;
    let summary = '';

    if (reportType === 'water' || reportType === 'integrated') {
      const filteredTests = waterTests.filter(t => {
        const matchesTank = selectedTankId === 'all' || t.tank_id === selectedTankId;
        const matchesDate = t.test_date >= startDate && t.test_date <= endDate;
        return matchesTank && matchesDate;
      });

      recordCount += filteredTests.length;
      
      csvContent += '--- WATER QUALITY AUDIT RECORDS ---\n';
      csvContent += 'Date,Tank Name,Salinity (ppt),Temp (C),pH,Ammonia (ppm),Nitrite (ppm),Nitrate (ppm),Notes\n';
      filteredTests.forEach(t => {
        csvContent += `"${t.test_date}","${t.tank_name || 'N/A'}",${t.salinity_ppt},${t.temperature_c},${t.ph},${t.ammonia_ppm},${t.nitrite_ppm},${t.nitrate_ppm},"${(t.notes || '').replace(/"/g, '""')}"\n`;
      });
      summary += `Water Quality: ${filteredTests.length} logs. `;
    }

    if (reportType === 'chemical' || reportType === 'integrated') {
      const filteredChemical = chemicalHistory.filter(c => {
        const matchesTank = selectedTankId === 'all' || c.tank_id === selectedTankId;
        const matchesDate = c.event_date >= startDate && c.event_date <= endDate;
        return matchesTank && matchesDate;
      });

      recordCount += filteredChemical.length;

      csvContent += '\n--- CHEMICAL DOSING AUDIT RECORDS ---\n';
      csvContent += 'Date,Tank Name,Chemical Applied,Amount (g),Reason/Notes\n';
      filteredChemical.forEach(c => {
        csvContent += `"${c.event_date}","${c.tank_name || 'N/A'}","${c.chemical_name}",${c.amount_grams},"${(c.reason || '').replace(/"/g, '""')}"\n`;
      });
      summary += `Chemical Dosing: ${filteredChemical.length} logs. `;
    }

    if (recordCount === 0) {
      alert('No data records found for the selected tank and date range.');
      return;
    }

    const reportName = `${tankName} - ${reportType === 'water' ? 'Water Audit' : reportType === 'chemical' ? 'Chemical Audit' : 'Integrated Report'}`;
    const filename = `report_${reportType}_${selectedTankId}_${Date.now()}.csv`;

    // 2. Trigger browser download of CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 3. Log to SQLite Reports table
    const payload = {
      name: reportName,
      report_type: reportType === 'water' ? 'Water Quality Audit' : reportType === 'chemical' ? 'Chemical Dosing' : 'Integrated Audit',
      filepath: filename,
      content_summary: `Date range: ${startDate} to ${endDate}. ${summary}`
    };

    const res = await createReport(payload);
    if (res.success && res.id) {
      const newReport: Report = {
        id: Number(res.id),
        ...payload,
        generated_at: new Date().toISOString().replace('T', ' ').split('.')[0]
      };
      setReports(prev => [newReport, ...prev]);
      setToastMsg(`Generated and downloaded report: "${reportName}"!`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Re-download older report (regenerate CSV content dynamically)
  const handleDownloadOldReport = (report: Report) => {
    // Determine target based on report name
    let filteredTests = [...waterTests];
    let filteredChemical = [...chemicalHistory];

    if (!report.name.includes('All Tanks')) {
      // Find tank name inside report name (e.g. "Nursery Tank A - Water Audit")
      const matchedTank = tanks.find(t => report.name.startsWith(t.name));
      if (matchedTank) {
        filteredTests = filteredTests.filter(t => t.tank_id === matchedTank.id);
        filteredChemical = filteredChemical.filter(c => c.tank_id === matchedTank.id);
      }
    }

    let csvContent = '';
    if (report.report_type.includes('Water') || report.report_type.includes('Integrated')) {
      csvContent += '--- WATER QUALITY AUDIT RECORDS ---\n';
      csvContent += 'Date,Tank Name,Salinity (ppt),Temp (C),pH,Ammonia (ppm),Nitrite (ppm),Nitrate (ppm),Notes\n';
      filteredTests.forEach(t => {
        csvContent += `"${t.test_date}","${t.tank_name || 'N/A'}",${t.salinity_ppt},${t.temperature_c},${t.ph},${t.ammonia_ppm},${t.nitrite_ppm},${t.nitrate_ppm},"${(t.notes || '').replace(/"/g, '""')}"\n`;
      });
    }

    if (report.report_type.includes('Chemical') || report.report_type.includes('Integrated')) {
      csvContent += '\n--- CHEMICAL DOSING AUDIT RECORDS ---\n';
      csvContent += 'Date,Tank Name,Chemical Applied,Amount (g),Reason/Notes\n';
      filteredChemical.forEach(c => {
        csvContent += `"${c.event_date}","${c.tank_name || 'N/A'}","${c.chemical_name}",${c.amount_grams},"${(c.reason || '').replace(/"/g, '""')}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', report.filepath || 'report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setToastMsg(`Downloaded report: "${report.name}"`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Delete generated report from list
  const handleDeleteReport = async (id: number) => {
    if (confirm('Are you sure you want to delete this report log from the history? This will not delete the downloaded file from your computer.')) {
      const res = await deleteReport(id);
      if (res.success) {
        setReports(prev => prev.filter(r => r.id !== id));
      } else {
        alert('Failed to delete report log.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileBarChart2 className="h-5 w-5 text-primary" />
          <span>Reports & Analysis Center</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Filter aquaculture data and export audit profiles to CSV files offline</p>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Generator Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">
          Report Generator Options
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Target Tank */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Tank</label>
            <select
              value={selectedTankId}
              onChange={(e) => setSelectedTankId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="form-input text-sm font-semibold"
            >
              <option value="all">All Tanks (Combined)</option>
              {tanks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Report Type */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="form-input text-sm font-semibold"
            >
              <option value="water">Water Quality Logs Only</option>
              <option value="chemical">Chemical Dosing Only</option>
              <option value="integrated">Integrated Audit (Both)</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input text-sm font-semibold"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input text-sm font-semibold"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleGenerateReport}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-2"
          >
            <Download className="h-4.5 w-4.5" />
            <span>Generate & Export CSV</span>
          </button>
        </div>
      </div>

      {/* Reports History */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <span>Generated Reports Log</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Historical records of reports compiled in this workspace</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Generated At</th>
                <th className="py-3 px-4">Report Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Parameters Checked / Summary</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-350">{report.generated_at}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{report.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/5 text-sky-600 dark:text-sky-400 border border-sky-500/10 text-[10px] font-semibold">
                      {report.report_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 italic max-w-sm truncate" title={report.content_summary || ''}>
                    {report.content_summary || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => handleDownloadOldReport(report)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title="Download File Again"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      title="Delete Report Entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No reports have been compiled yet. Use the option filters above to build one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
