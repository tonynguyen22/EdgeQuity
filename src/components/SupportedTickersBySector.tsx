import React from 'react';
import { Grid3X3 } from 'lucide-react';

interface SectorBucket {
  sector: string;
  tickers: readonly string[];
}

const SUPPORTED_TICKERS_BY_SECTOR: readonly SectorBucket[] = [
  {
    sector: 'Technology',
    tickers: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'INTC', 'CSCO', 'AMD', 'ADBE', 'PLTR', 'DOCU', 'ZM', 'ROKU'],
  },
  {
    sector: 'Communication',
    tickers: ['NFLX', 'DIS', 'T', 'VZ', 'VIAC', 'ATVI', 'SNAP', 'PINS', 'SIRI', 'TWTR', 'BILI', 'FUBO'],
  },
  {
    sector: 'Consumer Discretionary',
    tickers: ['AMZN', 'TSLA', 'NKE', 'TGT', 'SHOP', 'ETSY', 'RBLX', 'UBER', 'GM', 'F', 'LCID', 'CCL', 'MGM', 'RIVN', 'NIO'],
  },
  {
    sector: 'Consumer Staples',
    tickers: ['KO', 'COST', 'WMT', 'SBUX', 'PEP', 'WBA'],
  },
  {
    sector: 'Financials',
    tickers: ['JPM', 'BAC', 'V', 'PYPL', 'SQ', 'SOFI', 'HOOD', 'C', 'GS', 'WFC', 'RKT', 'COIN', 'RIOT'],
  },
  {
    sector: 'Healthcare',
    tickers: ['PFE', 'ABBV', 'MRNA', 'CPRX', 'JNJ', 'UNH', 'HCA'],
  },
  {
    sector: 'Industrials',
    tickers: ['BA', 'GE', 'FDX', 'LMT', 'CARR'],
  },
  {
    sector: 'Energy',
    tickers: ['XOM', 'CVX', 'ET', 'MRO'],
  },
  {
    sector: 'Airlines',
    tickers: ['DAL', 'UAL', 'AAL'],
  },
  {
    sector: 'International ADRs',
    tickers: ['BABA', 'TSM', 'SONY', 'NOK', 'BIDU'],
  },
  {
    sector: 'ETFs',
    tickers: ['SPY', 'VWO', 'SPYG'],
  },
  {
    sector: 'Other',
    tickers: ['TLRY'],
  },
];

interface SupportedTickersBySectorProps {
  accentClassName?: string;
  className?: string;
}

export default function SupportedTickersBySector({
  accentClassName = 'text-emerald-400',
  className = '',
}: SupportedTickersBySectorProps) {
  const totalTickers = SUPPORTED_TICKERS_BY_SECTOR.reduce((sum, bucket) => sum + bucket.tickers.length, 0);

  return (
    <div className={`bg-slate-900/40 border border-slate-700/40 rounded-lg p-3 space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Grid3X3 className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs font-semibold text-slate-300">Supported Tickers by Sector</span>
        <span className={`text-[11px] font-medium ${accentClassName}`}>({totalTickers})</span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Same curated ticker universe is used across all Valuation tabs.
      </p>

      <div className="max-h-40 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
        {SUPPORTED_TICKERS_BY_SECTOR.map((bucket) => (
          <div key={bucket.sector}>
            <div className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">
              {bucket.sector}{' '}
              <span className={`normal-case font-medium ${accentClassName}`}>({bucket.tickers.length})</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
              {bucket.tickers.join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
