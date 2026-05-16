import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { EDGEQUITY_SUPPORTED_TICKERS } from '../edgequity/universe';

interface TickerSearchProps {
  input: string;
  setInput: (v: string) => void;
  onSelect: (sym: string) => void;
  loading?: boolean;
  placeholder?: string;
  accentColor?: string;      // kept for focus ring only
  buttonLabel?: string;
}

/**
 * Shared dropdown ticker search that restricts to the Edgequity ticker universe.
 * Selecting from the dropdown only populates the input; the user must
 * click the Analyze button (or press Enter) to trigger the search.
 */
export default function TickerSearch({
  input, setInput, onSelect, loading = false,
  placeholder = 'Search supported tickers (e.g. AAPL, MSFT)',
  accentColor = 'emerald',
  buttonLabel = 'Analyze',
}: TickerSearchProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => {
    const q = input.trim().toUpperCase();
    if (!q) return [...EDGEQUITY_SUPPORTED_TICKERS];
    return EDGEQUITY_SUPPORTED_TICKERS.filter(t => t.includes(q));
  }, [input]);

  const isValid = input.trim() && (EDGEQUITY_SUPPORTED_TICKERS as readonly string[]).includes(input.trim().toUpperCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = input.trim().toUpperCase();
    if (sym && (EDGEQUITY_SUPPORTED_TICKERS as readonly string[]).includes(sym)) {
      onSelect(sym);
      setShowDropdown(false);
    }
  };

  /** Dropdown click only populates input — does NOT trigger onSelect */
  const handleDropdownPick = (sym: string) => {
    setInput(sym);
    setShowDropdown(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--vw-text-tertiary)' }} />
      <input
        value={input}
        onChange={e => { setInput(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        className={`w-full rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none uppercase transition-all`}
        style={{
          background: 'var(--vw-bg-raised)',
          border: '1px solid var(--vw-border-lit)',
          color: 'var(--vw-text-primary)',
          boxShadow: '0 0 30px -6px rgba(0, 212, 170, 0.15), 0 8px 24px -8px rgba(0,0,0,0.5)',
        }}
        autoComplete="off"
      />
      <button type="submit" disabled={!isValid || loading}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all z-10"
        style={{ background: 'linear-gradient(135deg, #00d4aa, #00a88a)' }}
      >
        {buttonLabel}
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
                onMouseDown={() => handleDropdownPick(t)}
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
              No matching ticker. Only {EDGEQUITY_SUPPORTED_TICKERS.length} pre-selected stocks are supported.
            </div>
          )}
        </div>
      )}
    </form>
  );
}
