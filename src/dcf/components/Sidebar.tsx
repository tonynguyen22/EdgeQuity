import React from 'react';
import { TrendingUp, Home, Activity, Users, Award, BarChart3, BarChart2, Eye, Newspaper, Coins, Trash2, RefreshCw, Zap, DollarSign, FileSpreadsheet } from 'lucide-react';
import type { TabId } from '../types';

interface SidebarProps {
  showLanding: boolean;
  activeTab: TabId;
  cacheCleared: boolean;
  onShowLanding: () => void;
  onTabChange: (tab: TabId) => void;
  onClearCache: () => void;
}

const NAV_SECTIONS = [
  {
    group: 'Analysis',
    items: [
      { id: 'dcf' as const, label: 'DCF', Icon: Activity, color: '#00d4aa' },
      { id: 'ddm' as const, label: 'DDM', Icon: DollarSign, color: '#f59e0b' },
      { id: 'multiples' as const, label: 'Multiples', Icon: BarChart3, color: '#f472b6' },
      { id: 'grade' as const, label: 'Quality', Icon: Award, color: '#f0b429' },
      { id: 'three-stmt' as const, label: '3-Statement', Icon: FileSpreadsheet, color: '#06b6d4' },
      { id: 'comp' as const, label: 'Peers', Icon: Users, color: '#38bdf8' },
    ],
  },
  {
    group: 'Market Data',
    items: [
      { id: 'tech' as const, label: 'Technical', Icon: TrendingUp, color: '#a78bfa' },
      { id: 'earnings' as const, label: 'Earnings', Icon: BarChart2, color: '#22d3ee' },
      { id: 'insider' as const, label: 'Insider & Inst.', Icon: Eye, color: '#fb923c' },
      { id: 'news' as const, label: 'News', Icon: Newspaper, color: '#38bdf8' },
      { id: 'dividend' as const, label: 'Dividends', Icon: Coins, color: '#fb7185' },
      { id: 'cycle' as const, label: 'Market Cycle', Icon: RefreshCw, color: '#2dd4bf' },
    ],
  },
];

export default function Sidebar({ showLanding, activeTab, cacheCleared, onShowLanding, onTabChange, onClearCache }: SidebarProps) {
  return (
    <aside
      className="w-56 shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto z-10"
      style={{
        background: 'linear-gradient(180deg, #0c1220 0%, #080c14 100%)',
        borderRight: '1px solid var(--vw-border-dim)',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={onShowLanding}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #00d4aa, #00a88a)',
              boxShadow: '0 0 16px -2px rgba(0, 212, 170, 0.3)',
            }}
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Valu<span style={{ color: 'var(--vw-accent)' }}>Wise</span>
          </span>
        </div>
      </div>

      {/* ── Separator ────────────────────────────────────────────────────── */}
      <div className="mx-4 h-px" style={{ background: 'linear-gradient(90deg, var(--vw-border-lit), transparent)' }} />

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-4 pb-3 space-y-4">
        {/* Home */}
        <button
          onClick={onShowLanding}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative"
          style={{
            background: showLanding ? 'var(--vw-accent-soft)' : 'transparent',
            color: showLanding ? 'var(--vw-accent)' : 'var(--vw-text-secondary)',
          }}
          onMouseEnter={(e) => { if (!showLanding) e.currentTarget.style.background = 'var(--vw-bg-hover)'; }}
          onMouseLeave={(e) => { if (!showLanding) e.currentTarget.style.background = 'transparent'; }}
        >
          {showLanding && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'var(--vw-accent)' }} />
          )}
          <Home className="w-4 h-4 shrink-0" />
          Home
        </button>

        {/* Sections */}
        {NAV_SECTIONS.map((section) => (
          <div key={section.group}>
            {/* Group label with decorative line */}
            <div className="flex items-center gap-2 px-3 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--vw-text-tertiary)' }}>
                {section.group}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--vw-border-dim)' }} />
            </div>

            {/* Items */}
            <div className="space-y-0.5">
              {section.items.map(({ id, label, Icon, color }) => {
                const isActive = activeTab === id && !showLanding;
                return (
                  <button
                    key={id}
                    onClick={() => onTabChange(id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative group"
                    style={{
                      background: isActive ? `${color}12` : 'transparent',
                      color: isActive ? color : 'var(--vw-text-secondary)',
                      fontWeight: isActive ? 500 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--vw-bg-hover)';
                        e.currentTarget.style.color = 'var(--vw-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--vw-text-secondary)';
                      }
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: color }}
                      />
                    )}
                    <Icon className="w-4 h-4 shrink-0" style={{ opacity: isActive ? 1 : 0.6 }} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom section ────────────────────────────────────────────────── */}
      <div className="px-3 pb-3 space-y-2">
        {/* Separator */}
        <div className="h-px" style={{ background: 'var(--vw-border-dim)' }} />

        {/* Clear Cache */}
        <button
          onClick={onClearCache}
          title="Clear cached data if search is stuck or showing stale results"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            background: cacheCleared ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
            border: `1px solid ${cacheCleared ? 'rgba(0, 212, 170, 0.25)' : 'var(--vw-border-dim)'}`,
            color: cacheCleared ? 'var(--vw-accent)' : 'var(--vw-text-tertiary)',
          }}
          onMouseEnter={(e) => {
            if (!cacheCleared) {
              e.currentTarget.style.borderColor = 'var(--vw-border-lit)';
              e.currentTarget.style.color = 'var(--vw-text-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!cacheCleared) {
              e.currentTarget.style.borderColor = 'var(--vw-border-dim)';
              e.currentTarget.style.color = 'var(--vw-text-tertiary)';
            }
          }}
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" />
          {cacheCleared ? 'Cache cleared!' : 'Clear Cache'}
        </button>

        {/* Version indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full vw-pulse" style={{ background: 'var(--vw-accent)' }} />
          <span className="text-[10px] font-mono" style={{ color: 'var(--vw-text-muted)' }}>
            v1.0 — Live
          </span>
        </div>
      </div>
    </aside>
  );
}
