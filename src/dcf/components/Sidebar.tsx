import React from 'react';
import { TrendingUp, Home, Activity, Users, Award, BarChart3, BarChart2, Eye, Newspaper, Coins, Trash2 } from 'lucide-react';
import type { TabId } from '../types';

interface SidebarProps {
  showLanding: boolean;
  activeTab: TabId;
  cacheCleared: boolean;
  onShowLanding: () => void;
  onTabChange: (tab: TabId) => void;
  onClearCache: () => void;
}

export default function Sidebar({ showLanding, activeTab, cacheCleared, onShowLanding, onTabChange, onClearCache }: SidebarProps) {
  return (
    <aside className="w-52 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col sticky top-0 h-screen overflow-y-auto z-10">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onShowLanding}>
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">ValuWise</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {/* Home */}
        <button
          onClick={onShowLanding}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${showLanding ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Home className="w-4 h-4 shrink-0" />
          Home
        </button>

        <div className="pt-2 pb-1 px-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Valuation</span>
        </div>
        {([
          { id: 'dcf', label: 'DCF Analysis', Icon: Activity, active: 'text-emerald-400' },
          { id: 'multiples', label: 'Multiples Analysis', Icon: BarChart3, active: 'text-pink-400' },
          { id: 'grade', label: 'Quality Analysis', Icon: Award, active: 'text-amber-400' },
          { id: 'comp', label: 'Peers Analysis', Icon: Users, active: 'text-blue-400' },
        ] as const).map(({ id, label, Icon, active }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === id && !showLanding ? `bg-slate-800 ${active}` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}

        <div className="pt-3 pb-1 px-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Market Data</span>
        </div>
        {([
          { id: 'tech', label: 'Technical', Icon: TrendingUp, active: 'text-violet-400' },
          { id: 'earnings', label: 'Earnings', Icon: BarChart2, active: 'text-cyan-400' },
          { id: 'insider', label: 'Insider & Inst.', Icon: Eye, active: 'text-orange-400' },
          { id: 'news', label: 'News & Sentiment', Icon: Newspaper, active: 'text-sky-400' },
          { id: 'dividend', label: 'Dividends', Icon: Coins, active: 'text-rose-400' },
        ] as const).map(({ id, label, Icon, active }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === id && !showLanding ? `bg-slate-800 ${active}` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}

      </nav>

      {/* Clear Cache */}
      <div className="px-2 py-3 border-t border-slate-800">
        <button
          onClick={onClearCache}
          title="Clear cached data if search is stuck or showing stale results"
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${cacheCleared
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:text-slate-200 hover:border-slate-600'
            }`}
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" />
          {cacheCleared ? 'Cache cleared!' : 'Clear Cache'}
        </button>
      </div>
    </aside>
  );
}
