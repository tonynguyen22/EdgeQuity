import React from 'react';
import {
  TrendingUp, Home, Activity, Users, Award, BarChart3, BarChart2,
  Eye, Newspaper, Coins, Trash2, RefreshCw, DollarSign, FileSpreadsheet,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen,
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
      { id: 'grade' as const, label: 'Quality Compare', Icon: Award, color: '#f0b429' },
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

/** Small tooltip shown on hover in collapsed mode */
function IconTooltip({ label }: { label: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: 'calc(100% + 10px)',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#f1f5f9',
        fontSize: '12px',
        fontWeight: 500,
        padding: '5px 10px',
        borderRadius: '8px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.1)',
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

  const sidebarWidth = collapsed ? 56 : 248;

  return (
    <aside
      style={{
        width: `${sidebarWidth}px`,
        minWidth: `${sidebarWidth}px`,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
        background: 'linear-gradient(180deg, #0c1220 0%, #070a12 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
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
      {/* ─── LOGO AREA ─── */}
      <div
        style={{
          padding: collapsed ? '14px 0 0' : '14px 14px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '10px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={onShowLanding}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00d4aa, #00a88a)',
            boxShadow: '0 0 18px -3px rgba(0, 212, 170, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'box-shadow 0.2s, transform 0.15s',
          }}
        >
          <TrendingUp style={{ width: '17px', height: '17px', color: 'white' }} />
        </div>
        {!collapsed && (
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            Valu<span style={{ color: '#00d4aa' }}>Wise</span>
          </span>
        )}
      </div>

      {/* ─── TOGGLE BUTTON ─── */}
      <div
        style={{
          padding: collapsed ? '10px 0 0' : '10px 14px 0',
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: collapsed ? '36px' : '100%',
            height: '30px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--vw-text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.03em',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,212,170,0.10)';
            e.currentTarget.style.borderColor = 'rgba(0,212,170,0.3)';
            e.currentTarget.style.color = '#00d4aa';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'var(--vw-text-tertiary)';
          }}
        >
          {collapsed ? (
            <PanelLeftOpen style={{ width: '14px', height: '14px' }} />
          ) : (
            <>
              <PanelLeftClose style={{ width: '14px', height: '14px' }} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* ─── DIVIDER ─── */}
      <div
        style={{
          margin: collapsed ? '10px 14px 0' : '10px 14px 0',
          height: '1px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.06), transparent)',
          flexShrink: 0,
        }}
      />

      {/* ─── NAVIGATION ─── */}
      <nav
        style={{
          flex: 1,
          padding: '10px 10px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Home button */}
        {collapsed ? (
          <div
            style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
            onMouseEnter={() => setHoveredIcon('icon-home')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <button
              onClick={onShowLanding}
              style={{
                width: '36px',
                height: '38px',
                borderRadius: '9px',
                boxSizing: 'border-box',
                border: 'none',
                background: showLanding ? 'rgba(0,212,170,0.15)' : 'transparent',
                color: showLanding ? '#00d4aa' : 'var(--vw-text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!showLanding) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'var(--vw-text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!showLanding) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--vw-text-tertiary)';
                }
              }}
            >
              {showLanding && (
                <span style={{
                  position: 'absolute',
                  left: '1px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '16px',
                  borderRadius: '0 3px 3px 0',
                  background: '#00d4aa',
                }} />
              )}
              <Home style={{ width: '18px', height: '18px', opacity: showLanding ? 1 : 0.6 }} />
            </button>
            {hoveredIcon === 'icon-home' && <IconTooltip label="Home" />}
          </div>
        ) : (
          <button
            onClick={onShowLanding}
            style={{
              width: '100%',
              height: '35px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 10px',
              borderRadius: '8px',
              border: 'none',
              background: showLanding ? 'rgba(0,212,170,0.12)' : 'transparent',
              color: showLanding ? '#00d4aa' : 'var(--vw-text-secondary)',
              fontSize: '14px',
              fontWeight: showLanding ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative',
              textAlign: 'left',
            }}
            onMouseEnter={e => { if (!showLanding) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (!showLanding) e.currentTarget.style.background = 'transparent'; }}
          >
            {showLanding && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3px',
                height: '18px',
                borderRadius: '0 3px 3px 0',
                background: '#00d4aa',
              }} />
            )}
            <Home style={{ width: '18px', height: '18px', flexShrink: 0, opacity: showLanding ? 1 : 0.55 }} />
            Home
          </button>
        )}

        {/* Section groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.group}>
              {/* Section header — fixed 18px height in both modes for exact alignment */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: collapsed ? '0 14px' : '0 10px',
                marginBottom: '4px',
                height: '18px',
                boxSizing: 'border-box',
                justifyContent: collapsed ? 'center' : 'flex-start',
                overflow: 'hidden',
              }}>
                {collapsed ? (
                  <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                ) : (
                  <>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--vw-text-tertiary)',
                      whiteSpace: 'nowrap',
                      lineHeight: '18px',
                    }}>
                      {section.group}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.04)' }} />
                  </>
                )}
              </div>

              {/* Nav items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {section.items.map(({ id, label, Icon, color }) => {
                  const isActive = activeTab === id && !showLanding;
                  const tooltipId = `icon-${id}`;

                  if (collapsed) {
                    return (
                      <div
                        key={id}
                        style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
                        onMouseEnter={() => setHoveredIcon(tooltipId)}
                        onMouseLeave={() => setHoveredIcon(null)}
                      >
                        <button
                          onClick={() => onTabChange(id)}
                          style={{
                            width: '36px',
                            height: '35px',
                            borderRadius: '9px',
                            boxSizing: 'border-box',
                            border: 'none',
                            background: isActive ? `${color}18` : 'transparent',
                            color: isActive ? color : 'var(--vw-text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            position: 'relative',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                              e.currentTarget.style.color = 'var(--vw-text-primary)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--vw-text-tertiary)';
                            }
                          }}
                        >
                          {isActive && (
                            <span style={{
                              position: 'absolute',
                              left: '1px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '3px',
                              height: '16px',
                              borderRadius: '0 3px 3px 0',
                              background: color,
                            }} />
                          )}
                          <Icon style={{ width: '18px', height: '18px', opacity: isActive ? 1 : 0.55 }} />
                        </button>
                        {hoveredIcon === tooltipId && <IconTooltip label={label} />}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={id}
                      onClick={() => onTabChange(id)}
                      style={{
                        width: '100%',
                        height: '38px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isActive ? `${color}10` : 'transparent',
                        color: isActive ? color : 'var(--vw-text-secondary)',
                        fontSize: '14px',
                        fontWeight: isActive ? 500 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.color = 'var(--vw-text-primary)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--vw-text-secondary)';
                        }
                      }}
                    >
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '3px',
                          height: '18px',
                          borderRadius: '0 3px 3px 0',
                          background: color,
                        }} />
                      )}
                      <Icon style={{ width: '18px', height: '18px', flexShrink: 0, opacity: isActive ? 1 : 0.55 }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ─── BOTTOM SECTION ─── */}
      <div
        style={{
          padding: collapsed ? '8px 10px 10px' : '0 10px 10px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.06), transparent)',
          marginBottom: '2px',
        }} />

        {/* Clear cache */}
        {collapsed ? (
          <div
            style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
            onMouseEnter={() => setHoveredIcon('icon-cache')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <button
              onClick={onClearCache}
              title="Clear cached data"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                border: 'none',
                background: cacheCleared ? 'rgba(0,212,170,0.12)' : 'transparent',
                color: cacheCleared ? '#00d4aa' : 'var(--vw-text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!cacheCleared) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'var(--vw-text-secondary)';
                }
              }}
              onMouseLeave={e => {
                if (!cacheCleared) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--vw-text-tertiary)';
                }
              }}
            >
              <Trash2 style={{ width: '15px', height: '15px' }} />
            </button>
            {hoveredIcon === 'icon-cache' && (
              <IconTooltip label={cacheCleared ? 'Cache cleared!' : 'Clear Cache'} />
            )}
          </div>
        ) : (
          <button
            onClick={onClearCache}
            title="Clear cached data if search is stuck or showing stale results"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '8px',
              border: `1px solid ${cacheCleared ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.06)'}`,
              background: cacheCleared ? 'rgba(0,212,170,0.08)' : 'transparent',
              color: cacheCleared ? '#00d4aa' : 'var(--vw-text-tertiary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              if (!cacheCleared) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = 'var(--vw-text-secondary)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }
            }}
            onMouseLeave={e => {
              if (!cacheCleared) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'var(--vw-text-tertiary)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <Trash2 style={{ width: '14px', height: '14px', flexShrink: 0 }} />
            {cacheCleared ? 'Cache cleared!' : 'Clear Cache'}
          </button>
        )}

        {/* Version tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '6px',
            padding: collapsed ? '4px 0' : '2px 10px',
          }}
        >
          <div style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#00d4aa',
            boxShadow: '0 0 6px rgba(0,212,170,0.5)',
            flexShrink: 0,
          }} />
          {!collapsed && (
            <span style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: 'var(--vw-text-muted)',
              whiteSpace: 'nowrap',
            }}>
              v1.0 — Live
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
