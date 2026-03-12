import React from 'react';
import {
  TrendingUp, Home, Activity, Users, Award, BarChart3, BarChart2,
  Eye, Newspaper, Coins, Trash2, RefreshCw, DollarSign, FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';
import type { TabId } from '../types';

interface SidebarProps {
  showLanding: boolean;
  activeTab: TabId;
  cacheCleared: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onShowLanding: () => void;
  onTabChange: (tab: TabId) => void;
  onClearCache: () => void;
}

const NAV_SECTIONS = [
  {
    group: 'Valuation',
    items: [
      { id: 'dcf' as const, label: 'DCF', Icon: Activity, color: '#00d4aa' },
      { id: 'ddm' as const, label: 'DDM', Icon: DollarSign, color: '#f59e0b' },
      { id: 'multiples' as const, label: 'Multiples', Icon: BarChart3, color: '#f472b6' },
    ],
  },
  {
    group: 'Fundamentals',
    items: [
      { id: 'grade' as const, label: 'Quality', Icon: Award, color: '#f0b429' },
      { id: 'three-stmt' as const, label: '3-Statement', Icon: FileSpreadsheet, color: '#06b6d4' },
      { id: 'comp' as const, label: 'Peers', Icon: Users, color: '#38bdf8' },
    ],
  },
  {
    group: 'Market Intelligence',
    items: [
      { id: 'tech' as const, label: 'Technical', Icon: TrendingUp, color: '#a78bfa' },
      { id: 'earnings' as const, label: 'Earnings', Icon: BarChart2, color: '#22d3ee' },
      { id: 'insider' as const, label: 'Insider & Inst.', Icon: Eye, color: '#fb923c' },
      { id: 'news' as const, label: 'News', Icon: Newspaper, color: '#38bdf8' },
    ],
  },
  {
    group: 'Income & Macro',
    items: [
      { id: 'dividend' as const, label: 'Dividends', Icon: Coins, color: '#fb7185' },
      { id: 'cycle' as const, label: 'Market Cycle', Icon: RefreshCw, color: '#2dd4bf' },
    ],
  },
];

// All nav items flat, for the icon rail
const ALL_NAV_ITEMS = [
  { id: 'home' as const, label: 'Home', Icon: Home, color: '#00d4aa', isHome: true },
  ...NAV_SECTIONS.flatMap(s => s.items.map(i => ({ ...i, isHome: false }))),
];

/** Small tooltip shown on hover in collapsed mode */
function IconTooltip({ label }: { label: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: 'calc(100% + 8px)',
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#1e293b',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#f1f5f9',
        fontSize: '11px',
        fontWeight: 500,
        padding: '4px 8px',
        borderRadius: '6px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        zIndex: 100,
      }}
    >
      {label}
    </span>
  );
}

export default function Sidebar({
  showLanding,
  activeTab,
  cacheCleared,
  collapsed,
  onToggleCollapse,
  onShowLanding,
  onTabChange,
  onClearCache,
}: SidebarProps) {
  const [hoveredIcon, setHoveredIcon] = React.useState<string | null>(null);

  return (
    <aside
      style={{
        width: collapsed ? '56px' : '224px',
        minWidth: collapsed ? '56px' : '224px',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
        background: 'linear-gradient(180deg, #0c1220 0%, #080c14 100%)',
        borderRight: '1px solid var(--vw-border-dim)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* ───────────────── COLLAPSED ICON RAIL ───────────────── */}
      {collapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', paddingTop: '12px' }}>

          {/* Logo icon — click to go home */}
          <button
            onClick={onShowLanding}
            title="Home"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #00d4aa, #00a88a)',
              boxShadow: '0 0 16px -2px rgba(0, 212, 170, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'transform 0.15s, box-shadow 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 0 22px -2px rgba(0,212,170,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 16px -2px rgba(0,212,170,0.35)'; }}
          >
            <TrendingUp style={{ width: '18px', height: '18px', color: 'white' }} />
          </button>

          {/* Divider */}
          <div style={{ width: '28px', height: '1px', background: 'var(--vw-border-dim)', marginBottom: '8px' }} />

          {/* Nav icons */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', alignItems: 'center', paddingBottom: '8px' }}>
            {ALL_NAV_ITEMS.map(({ id, label, Icon, color, isHome }) => {
              const isActive = isHome ? showLanding : (activeTab === id && !showLanding);
              const tooltipId = `icon-${id}`;
              return (
                <div
                  key={id}
                  style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
                  onMouseEnter={() => setHoveredIcon(tooltipId)}
                  onMouseLeave={() => setHoveredIcon(null)}
                >
                  <button
                    onClick={isHome ? onShowLanding : () => onTabChange(id as TabId)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9px',
                      border: 'none',
                      background: isActive ? `${color}1a` : 'transparent',
                      color: isActive ? color : 'var(--vw-text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s, transform 0.15s',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--vw-bg-hover)';
                        e.currentTarget.style.color = 'var(--vw-text-primary)';
                      }
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--vw-text-tertiary)';
                      }
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Active indicator dot */}
                    {isActive && (
                      <span style={{
                        position: 'absolute',
                        left: '2px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '18px',
                        borderRadius: '0 3px 3px 0',
                        background: color,
                      }} />
                    )}
                    <Icon style={{ width: '16px', height: '16px', opacity: isActive ? 1 : 0.65 }} />
                  </button>
                  {hoveredIcon === tooltipId && <IconTooltip label={label} />}
                </div>
              );
            })}
          </div>

          {/* Expand button — full-width glowing pill */}
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            style={{
              width: '40px',
              height: '56px',
              borderRadius: '10px',
              border: '1px solid rgba(0,212,170,0.4)',
              background: 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(0,168,138,0.12))',
              boxShadow: '0 0 18px -4px rgba(0,212,170,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
              color: '#00d4aa',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,170,0.30), rgba(0,168,138,0.22))';
              e.currentTarget.style.boxShadow = '0 0 28px -4px rgba(0,212,170,0.7), inset 0 1px 0 rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(0,168,138,0.12))';
              e.currentTarget.style.boxShadow = '0 0 18px -4px rgba(0,212,170,0.45), inset 0 1px 0 rgba(255,255,255,0.06)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ChevronRight style={{ width: '14px', height: '14px' }} />
            <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.9 }}>OPEN</span>
          </button>
        </div>
      ) : (
        /* ───────────────── EXPANDED FULL SIDEBAR ───────────────── */
        <>
          {/* Logo row with collapse button */}
          <div style={{ padding: '12px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={onShowLanding}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
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

            {/* Collapse button — labelled chip */}
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              style={{
                height: '28px',
                paddingLeft: '8px',
                paddingRight: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(0,212,170,0.25)',
                background: 'rgba(0,212,170,0.08)',
                color: 'var(--vw-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                flexShrink: 0,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,212,170,0.16)';
                e.currentTarget.style.borderColor = 'rgba(0,212,170,0.55)';
                e.currentTarget.style.boxShadow = '0 0 10px -2px rgba(0,212,170,0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0,212,170,0.08)';
                e.currentTarget.style.borderColor = 'rgba(0,212,170,0.25)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Left-pointing chevron to collapse */}
              <ChevronRight style={{ width: '13px', height: '13px', transform: 'rotate(180deg)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em' }}>Hide</span>
            </button>
          </div>

          {/* Separator */}
          <div className="mx-4 h-px mt-3" style={{ background: 'linear-gradient(90deg, var(--vw-border-lit), transparent)' }} />

          {/* Navigation */}
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
                <div className="flex items-center gap-2 px-3 mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--vw-text-tertiary)' }}>
                    {section.group}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--vw-border-dim)' }} />
                </div>

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

          {/* Bottom section */}
          <div className="px-3 pb-3 space-y-2">
            <div className="h-px" style={{ background: 'var(--vw-border-dim)' }} />

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

            <div className="flex items-center gap-1.5 px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full vw-pulse" style={{ background: 'var(--vw-accent)' }} />
              <span className="text-[10px] font-mono" style={{ color: 'var(--vw-text-muted)' }}>
                v1.0 — Live
              </span>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
