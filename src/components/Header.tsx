'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Database, Clock, WifiOff } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState<string>('');

  // Format local system clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Map pathnames to human readable page titles
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard Overview';
      case '/tanks':
        return 'Tank Management';
      case '/volume-calculator':
        return 'Tank Volume Calculator';
      case '/salinity-calculator':
        return 'Salinity Adjuster';
      case '/chemical-dosing':
        return 'Chemical Dosing Manager';
      case '/bulk-dosing':
        return 'Bulk Dosing Planner';
      case '/water-records':
        return 'Water Quality Logs';
      case '/reports':
        return 'Export & Analysis Reports';
      case '/settings':
        return 'System Configuration';
      default:
        return 'CrabShack Water Pro';
    }
  };

  return (
    <header className="glass-panel border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          {getPageTitle()}
        </h1>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
          CrabShack Aquacultural Management Suite
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Offline Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 text-xs font-semibold">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Local Offline Mode</span>
        </div>

        {/* Database Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 text-xs font-semibold">
          <Database className="h-3.5 w-3.5" />
          <span>SQLite Connected</span>
        </div>

        {/* System Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-semibold border-l border-slate-200 dark:border-slate-800 pl-4">
          <Clock className="h-4 w-4" />
          <span>{time}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/30 dark:border-slate-700/50"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
