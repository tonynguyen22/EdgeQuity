import React from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { SUPPORTED_TICKERS } from '../../dcf/types';
import SupportedTickersBySector from '../../components/SupportedTickersBySector';

interface DDMSearchProps {
  tickerInput: string;
  filteredTickers: string[];
  showDropdown: boolean;
  isValid: boolean;
  onTickerInputChange: (val: string) => void;
  onShowDropdown: (show: boolean) => void;
  onDropdownPick: (sym: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

export default function DDMSearch({
  tickerInput, filteredTickers, showDropdown, isValid,
  onTickerInputChange, onShowDropdown, onDropdownPick, onSearch,
}: DDMSearchProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--vw-text-primary)' }}>
          Dividend Discount <span style={{ color: 'var(--vw-accent)' }}>Model</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
          Value stocks based on projected future dividend payments
        </p>
      </div>

      <form onSubmit={onSearch} className="relative w-full max-w-xl">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--vw-text-tertiary)' }} />
        <input
          type="text"
          value={tickerInput}
          onChange={e => { onTickerInputChange(e.target.value); onShowDropdown(true); }}
          onFocus={() => onShowDropdown(true)}
          onBlur={() => setTimeout(() => onShowDropdown(false), 200)}
          placeholder="Search supported tickers (e.g. KO, JNJ, PEP)"
          className="w-full rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none uppercase transition-all"
          style={{
            background: 'var(--vw-bg-raised)',
            border: '1px solid var(--vw-border-lit)',
            color: 'var(--vw-text-primary)',
            boxShadow: '0 0 30px -6px rgba(0, 212, 170, 0.15), 0 8px 24px -8px rgba(0,0,0,0.5)',
          }}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!isValid}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all z-10"
          style={{ background: 'linear-gradient(135deg, #00d4aa, #00a88a)' }}
        >
          Analyze
        </button>

        {showDropdown && (
          <div className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-2xl max-h-48 overflow-y-auto"
            style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)' }}
          >
            {filteredTickers.length > 0 ? (
              filteredTickers.slice(0, 20).map(t => (
                <button
                  key={t}
                  type="button"
                  onMouseDown={() => onDropdownPick(t)}
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
      <div className="w-full max-w-2xl mt-8 rounded-xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
        <ul className="space-y-2.5">
          {[
            'Values a stock based on the dividends it pays out to shareholders',
            'Best suited for stable, mature companies with consistent dividend histories',
            'Offers three models: simple growth, gradual slowdown, and multi-stage forecasting',
            'Shows a sensitivity table so you can see how small changes in assumptions affect the result',
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
