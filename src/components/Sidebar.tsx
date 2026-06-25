'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Waves, 
  Ruler, 
  Droplet, 
  FlaskConical, 
  Layers, 
  ClipboardList, 
  FileBarChart2, 
  Settings,
  Shell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tanks', label: 'Tank Management', icon: Waves },
  { href: '/volume-calculator', label: 'Volume Calculator', icon: Ruler },
  { href: '/salinity-calculator', label: 'Salinity Calculator', icon: Droplet },
  { href: '/chemical-dosing', label: 'Chemical Dosing', icon: FlaskConical },
  { href: '/bulk-dosing', label: 'Bulk Dosing', icon: Layers },
  { href: '/water-records', label: 'Water Quality Records', icon: ClipboardList },
  { href: '/reports', label: 'Reports & Logs', icon: FileBarChart2 },
  { href: '/settings', label: 'System Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={`glass-panel h-screen border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between sticky top-0 z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Logo/Brand Header */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 h-16 overflow-hidden">
          <div className="bg-gradient-to-tr from-primary to-accent p-2 rounded-lg text-white shadow-md flex-shrink-0 animate-pulse">
            <Shell className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col whitespace-nowrap animate-fade-in">
              <span className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-100 uppercase">
                CrabShack
              </span>
              <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">
                Water Quality Pro
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Collapse/Expand Toggle Button at bottom */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-black/10 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-xs font-semibold ml-2">Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
