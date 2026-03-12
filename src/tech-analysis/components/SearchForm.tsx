import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { SUPPORTED_TICKERS } from '../../dcf/types';

interface SearchFormProps {
  tickerInput: string;
  setTickerInput: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function SearchForm({ tickerInput, setTickerInput, loading, onSubmit }: SearchFormProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => {
    const q = tickerInput.trim().toUpperCase();
    if (!q) return [...SUPPORTED_TICKERS];
    return SUPPORTED_TICKERS.filter(t => t.includes(q));
  }, [tickerInput]);

  const isValid = tickerInput.trim() && (SUPPORTED_TICKERS as readonly string[]).includes(tickerInput.trim().toUpperCase());

  /** Dropdown click only populates input — does NOT trigger submit */
  const handleSelect = (sym: string) => {
    setTickerInput(sym);
    setShowDropdown(false);
  };

  return (
    <form id="tech-search-form" onSubmit={onSubmit} className="w-full max-w-xl mx-auto relative">
      <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--vw-text-tertiary)' }} />
      <input
        type="text"
        value={tickerInput}
        onChange={e => { setTickerInput(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="Search supported tickers (e.g. AAPL, MSFT)"
        className="w-full rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none uppercase transition-all"
        style={{
          background: 'var(--vw-bg-raised)',
          border: '1px solid var(--vw-border-lit)',
          color: 'var(--vw-text-primary)',
          boxShadow: '0 0 30px -6px rgba(0, 212, 170, 0.15), 0 8px 24px -8px rgba(0,0,0,0.5)',
        }}
      />

      <button
        type="submit"
        disabled={!isValid || loading}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all z-10"
        style={{ background: 'linear-gradient(135deg, #00d4aa, #00a88a)' }}
      >
        Analyze
      </button>

      {showDropdown && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-2xl max-h-48 overflow-y-auto"
          style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)' }}
        >
          {filtered.length > 0 ? (
            filtered.slice(0, 20).map(t => (
              <button
                key={t}
                type="button"
                onMouseDown={() => handleSelect(t)}
                className="w-full text-left px-4 py-2.5 text-sm font-mono transition-colors first:rounded-t-xl last:rounded-b-xl"
                style={{ color: 'var(--vw-text-primary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--vw-bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {t}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>
              No matching ticker. Only {SUPPORTED_TICKERS.length} pre-selected stocks are supported.
            </div>
          )}
        </div>
      )}
    </form>
  );
}
