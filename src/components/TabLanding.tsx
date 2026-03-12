import React from 'react';
import TickerSearch from './TickerSearch';
import SupportedTickersBySector from './SupportedTickersBySector';

interface TabLandingProps {
  /** First part of the hero title (white text) */
  title: string;
  /** Accented part of the hero title (emerald text) */
  accentTitle: string;
  /** One-liner subtitle below the title */
  subtitle: string;
  /** Items for the "About this tab" section — plain-language bullets */
  aboutItems: string[];
  /** Search input value */
  searchInput?: string;
  /** Search input setter */
  setSearchInput?: (v: string) => void;
  /** Called when user clicks Analyze */
  onAnalyze?: (sym: string) => void;
  /** Whether to show search (false for market-cycle) */
  showSearch?: boolean;
}

/**
 * Shared landing page for all tabs.
 * Renders: hero title → search box → about section → supported tickers.
 */
export default function TabLanding({
  title,
  accentTitle,
  subtitle,
  aboutItems,
  searchInput = '',
  setSearchInput,
  onAnalyze,
  showSearch = true,
}: TabLandingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--vw-text-primary)' }}>
          {title} <span style={{ color: 'var(--vw-accent)' }}>{accentTitle}</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
          {subtitle}
        </p>
      </div>

      {/* Search */}
      {showSearch && setSearchInput && onAnalyze && (
        <div className="w-full max-w-xl">
          <TickerSearch input={searchInput} setInput={setSearchInput} onSelect={onAnalyze} />
        </div>
      )}

      {/* About Section */}
      <div className="w-full max-w-2xl mt-8 rounded-xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
        <ul className="space-y-2.5">
          {aboutItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: 'rgba(0,212,170,0.12)', color: 'var(--vw-accent)' }}>
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Supported Tickers */}
        <SupportedTickersBySector className="mt-4" />
      </div>
    </div>
  );
}
