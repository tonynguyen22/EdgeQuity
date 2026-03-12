import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { SUPPORTED_TICKERS } from '../../dcf/types';
import SupportedTickersBySector from '../../components/SupportedTickersBySector';

interface SearchFormProps {
  tickerInput: string;
  loading: boolean;
  onTickerInputChange: (value: string) => void;
  onSearch: (ticker: string) => void;
}

export default function SearchForm({ tickerInput, loading, onTickerInputChange, onSearch }: SearchFormProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const filteredTickers = useMemo(() => {
    const q = tickerInput.trim().toUpperCase();
    if (!q) return [...SUPPORTED_TICKERS];
    return SUPPORTED_TICKERS.filter(t => t.includes(q));
  }, [tickerInput]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = tickerInput.trim().toUpperCase();
    if (sym && (SUPPORTED_TICKERS as readonly string[]).includes(sym)) {
      onSearch(sym);
      setShowDropdown(false);
    }
  };

  /** Dropdown click only sets input — does NOT trigger onSearch */
  const handleSelect = (ticker: string) => {
    onTickerInputChange(ticker);
    setShowDropdown(false);
  };

  const isValid = tickerInput.trim() && (SUPPORTED_TICKERS as readonly string[]).includes(tickerInput.trim().toUpperCase());

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--vw-text-primary)' }}>
          Multiples <span style={{ color: 'var(--vw-accent)' }}>Analysis</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
          Historical valuation multiples with 5-year trend data
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative w-full max-w-xl" ref={formRef}>
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--vw-text-tertiary)' }} />
        <input
          type="text"
          value={tickerInput}
          onChange={(e) => {
            onTickerInputChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search supported tickers (e.g. AAPL, MSFT, TSLA)"
          className="w-full rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none uppercase transition-all"
          style={{
            background: 'var(--vw-bg-raised)',
            border: '1px solid var(--vw-border-lit)',
            color: 'var(--vw-text-primary)',
            boxShadow: '0 0 30px -6px rgba(0, 212, 170, 0.15), 0 8px 24px -8px rgba(0,0,0,0.5)',
          }}
          autoComplete="off"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !isValid}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-5 py-2.5 rounded-lg font-medium transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed z-10"
          style={{ background: 'linear-gradient(135deg, #00d4aa, #00a88a)' }}
        >
          {loading ? 'Loading...' : 'Analyze'}
        </button>
        {showDropdown && filteredTickers.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50"
            style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)' }}
          >
            {filteredTickers.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleSelect(t)}
                className="w-full text-left px-4 py-2.5 text-sm font-mono transition-colors first:rounded-t-xl last:rounded-b-xl"
                style={{ color: 'var(--vw-text-primary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--vw-bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        {showDropdown && filteredTickers.length === 0 && tickerInput.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl z-50 px-4 py-3 text-sm"
            style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-tertiary)' }}
          >
            No matching ticker found. Only {SUPPORTED_TICKERS.length} pre-selected stocks are supported.
          </div>
        )}
      </form>

      <div className="w-full max-w-2xl mt-8 rounded-xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
        <ul className="space-y-2.5">
          {[
            "Compares a stock's current valuation ratios (like P/E, EV/EBITDA) to its own history",
            "Shows 5-year averages, medians, highs, and lows for each multiple",
            "Visualizes trend charts so you can see if the stock is getting cheaper or more expensive over time",
            "Highlights whether the stock trades at a premium or discount vs. its historical average",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: 'rgba(0,212,170,0.12)', color: 'var(--vw-accent)' }}>
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <SupportedTickersBySector className="mt-4" />
      </div>
    </div>
  );
}
