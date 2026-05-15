import type { FundraStockRecord } from '../types';

interface StockDetailProps {
  stock: FundraStockRecord;
  onBack: () => void;
}

function formatNumber(value: number | null, suffix = ''): string {
  if (value === null) return 'n/a';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
}

function formatPercent(value: number | null): string {
  if (value === null) return 'n/a';
  return `${(value * 100).toFixed(1)}%`;
}

export default function StockDetail({ stock, onBack }: StockDetailProps) {
  return (
    <section className="vw-card p-5">
      <button
        type="button"
        className="mb-5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        style={{
          background: 'var(--vw-bg-surface)',
          border: '1px solid var(--vw-border-lit)',
          color: 'var(--vw-text-secondary)',
        }}
        onClick={onBack}
      >
        Back
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-sm" style={{ color: 'var(--vw-accent)' }}>{stock.ticker}</p>
          <h2 className="text-2xl font-semibold">{stock.name}</h2>
          <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
            {[stock.sector, stock.industry].filter(Boolean).join(' / ') || 'Classification unavailable'}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs uppercase font-semibold" style={{ color: 'var(--vw-text-tertiary)' }}>Price</p>
          <p className="font-mono text-xl">{stock.currency ?? 'USD'} {formatNumber(stock.price)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['P/E TTM', formatNumber(stock.valuation.peTTM, 'x')],
          ['FCF Yield', formatPercent(stock.valuation.fcfYield)],
          ['ROIC', formatPercent(stock.profitability.roic)],
          ['Revenue CAGR 3Y', formatPercent(stock.growth.revenueCagr3y)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg p-4" style={{ background: 'var(--vw-bg-surface)', border: '1px solid var(--vw-border)' }}>
            <p className="text-xs uppercase font-semibold" style={{ color: 'var(--vw-text-tertiary)' }}>{label}</p>
            <p className="mt-2 font-mono text-lg">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
