import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, BarChart3 } from 'lucide-react';
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

  const handleSelect = (ticker: string) => {
    onSearch(ticker);
    setShowDropdown(false);
  };

  const isValid = tickerInput.trim() && (SUPPORTED_TICKERS as readonly string[]).includes(tickerInput.trim().toUpperCase());

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <form onSubmit={handleSubmit} className="relative" ref={formRef}>
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
        <input
          type="text"
          value={tickerInput}
          onChange={(e) => {
            onTickerInputChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search supported tickers (e.g. AAPL, MSFT, TSLA)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase transition-all shadow-xl"
          autoComplete="off"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !isValid}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed z-10"
        >
          {loading ? 'Loading...' : 'Analyze'}
        </button>
        {showDropdown && filteredTickers.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50">
            {filteredTickers.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleSelect(t)}
                className="w-full text-left px-4 py-2.5 text-sm font-mono hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl text-slate-200"
              >
                {t}
              </button>
            ))}
          </div>
        )}
        {showDropdown && filteredTickers.length === 0 && tickerInput.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 px-4 py-3 text-sm text-slate-500">
            No matching ticker found. Only {SUPPORTED_TICKERS.length} pre-selected stocks are supported.
          </div>
        )}
      </form>

      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-300">About Multiples Analysis</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          View key valuation multiples with 5-year historical data. Multiples are computed from standardized financials (FMP) with true historical prices from Finnhub, giving you an accurate picture of how the market has valued the company over time.
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {[
            'Select a ticker and press Analyze to fetch financial data and historical prices.',
            'P/E, EV/EBITDA, EV/Revenue, EV/EBIT: earnings and enterprise value multiples.',
            'P/B, P/S, P/FCF: price-based multiples for book value, sales, and cash flow.',
            'Historical table with 5-year avg, median, high, and low for each multiple.',
            'Trend charts visualize how multiples evolved over recent fiscal years.',
            'Valuation context shows premium/discount vs historical average for each multiple.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs text-pink-400 font-semibold">{i + 1}</span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <SupportedTickersBySector accentClassName="text-pink-400" className="mt-2" />
      </div>

      <div className="flex flex-col items-center py-10 space-y-3 text-center">
        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center">
          <BarChart3 className="w-7 h-7 text-slate-500" />
        </div>
        <p className="text-slate-500 text-sm">Enter a ticker above to view valuation multiples.</p>
      </div>
    </div>
  );
}
