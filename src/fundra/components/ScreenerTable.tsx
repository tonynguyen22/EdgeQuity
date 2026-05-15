import type { FundraStockRecord } from '../types';

interface ScreenerTableProps {
  stocks: FundraStockRecord[];
  onSelectStock: (ticker: string) => void;
}

function formatMarketCap(value: number | null): string {
  if (value === null) return 'Market cap n/a';

  if (Math.abs(value) >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }

  return `$${value.toLocaleString()}`;
}

export default function ScreenerTable({ stocks, onSelectStock }: ScreenerTableProps) {
  return (
    <section className="vw-card overflow-x-auto">
      <div
        className="grid min-w-[720px] grid-cols-[120px_minmax(0,1fr)_180px_140px] gap-4 px-4 py-3 text-xs font-semibold uppercase"
        style={{ color: 'var(--vw-text-tertiary)', borderBottom: '1px solid var(--vw-border)' }}
      >
        <span>Ticker</span>
        <span>Name</span>
        <span>Sector</span>
        <span className="text-right">Market Cap</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--vw-border-dim)' }}>
        {stocks.map((stock) => (
          <button
            key={stock.ticker}
            type="button"
            className="grid min-w-[720px] w-full grid-cols-[120px_minmax(0,1fr)_180px_140px] gap-4 px-4 py-3 text-left transition-colors"
            style={{ color: 'var(--vw-text-primary)' }}
            onClick={() => onSelectStock(stock.ticker)}
            onMouseEnter={(event) => { event.currentTarget.style.background = 'var(--vw-bg-hover)'; }}
            onMouseLeave={(event) => { event.currentTarget.style.background = 'transparent'; }}
          >
            <span className="font-mono text-sm" style={{ color: 'var(--vw-accent)' }}>
              {stock.ticker}
            </span>
            <span className="truncate text-sm">{stock.name}</span>
            <span className="truncate text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
              {stock.sector ?? 'Unclassified'}
            </span>
            <span className="text-right text-sm font-mono" style={{ color: 'var(--vw-text-secondary)' }}>
              {formatMarketCap(stock.marketCap)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
