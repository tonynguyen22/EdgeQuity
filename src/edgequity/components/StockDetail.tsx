import { EDGEQUITY_COLUMNS, formatEdgequityValue, getColumnValue } from '../metrics';
import type { EdgequityColumn, EdgequityMetricGroup, EdgequityStockRecord } from '../types';

interface StockDetailProps {
  stock: EdgequityStockRecord;
  onBack: () => void;
}

interface MetricGroupDefinition {
  id: Exclude<EdgequityMetricGroup, 'profile'>;
  label: string;
}

const METRIC_GROUPS: MetricGroupDefinition[] = [
  { id: 'valuation', label: 'Valuation' },
  { id: 'profitability', label: 'Profitability' },
  { id: 'growth', label: 'Growth' },
  { id: 'financialHealth', label: 'Financial health' },
  { id: 'cashFlow', label: 'Cash flow' },
  { id: 'dividends', label: 'Dividends' },
];

const HISTORY_MONEY_FIELDS = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'grossProfit', label: 'Gross Profit' },
  { id: 'operatingIncome', label: 'Operating Income' },
  { id: 'netIncome', label: 'Net Income' },
  { id: 'freeCashFlow', label: 'Free Cash Flow' },
  { id: 'totalDebt', label: 'Total Debt' },
  { id: 'totalEquity', label: 'Equity' },
] as const;

type HistoryMoneyField = (typeof HISTORY_MONEY_FIELDS)[number]['id'];

function getGroupColumns(group: EdgequityMetricGroup): EdgequityColumn[] {
  return EDGEQUITY_COLUMNS.filter((column) => column.group === group);
}

function formatHistoryMoney(value: number | null): string {
  return formatEdgequityValue(value, 'money');
}

export default function StockDetail({ stock, onBack }: StockDetailProps) {
  const sectorLine = [stock.sector, stock.industry].filter(Boolean).join(' / ') || 'Classification unavailable';

  return (
    <div className="space-y-3">
      <button type="button" className="eq-back-button" onClick={onBack}>
        Back to screener
      </button>

      <section className="eq-detail-hero">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase text-[var(--vw-accent)]">{stock.ticker}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">{stock.name}</h2>
          <p className="mt-1 text-sm text-[var(--vw-text-secondary)]">{sectorLine}</p>
        </div>
        <div className="eq-kpi-strip">
          <HeaderMetric label="Price" value={`${stock.currency ?? 'USD'} ${formatEdgequityValue(stock.price, 'number')}`} />
          <HeaderMetric label="Market Cap" value={formatEdgequityValue(stock.marketCap, 'money')} />
          <HeaderMetric label="Enterprise Value" value={formatEdgequityValue(stock.enterpriseValue, 'money')} />
          <HeaderMetric label="FCF Yield" value={formatEdgequityValue(stock.valuation.fcfYield, 'percent')} highlight />
        </div>
      </section>

      {stock.warnings.length > 0 && (
        <section className="eq-note-panel">
          <h3>Investment notes</h3>
          <ul>
            {stock.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {METRIC_GROUPS.map((group) => (
          <MetricGroupCard key={group.id} stock={stock} group={group} />
        ))}
      </section>

      <HistoryTable stock={stock} />
    </div>
  );
}

function HeaderMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase" style={{ color: 'var(--vw-text-tertiary)' }}>
        {label}
      </p>
      <p
        className={`font-mono text-sm font-semibold tabular-nums ${
          highlight ? 'text-[var(--vw-green)]' : 'text-[var(--vw-text-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MetricGroupCard({ stock, group }: { stock: EdgequityStockRecord; group: MetricGroupDefinition }) {
  const columns = getGroupColumns(group.id);

  return (
    <article className="eq-metric-panel">
      <h3 className="text-sm font-semibold uppercase" style={{ color: 'var(--vw-text-tertiary)' }}>
        {group.label}
      </h3>
      <dl className="mt-3">
        {columns.map((column) => {
          const formattedValue = formatEdgequityValue(getColumnValue(stock, column), column.format);
          const isMissing = formattedValue === '-';

          return (
            <div
              key={column.id}
              className="flex min-h-8 items-center justify-between gap-4 border-t border-[var(--vw-border-dim)] py-1.5 first:border-t-0"
            >
              <dt className="min-w-0 truncate text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
                {column.label}
              </dt>
              <dd
                className="shrink-0 font-mono text-sm tabular-nums"
                style={{ color: isMissing ? 'var(--vw-text-tertiary)' : 'var(--vw-text-primary)' }}
              >
                {formattedValue}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}

function HistoryTable({ stock }: { stock: EdgequityStockRecord }) {
  return (
    <section className="vw-card eq-history-panel overflow-hidden">
      <div className="border-b px-3 py-2" style={{ borderColor: 'var(--vw-border)' }}>
        <h3 className="text-xs font-semibold uppercase text-[var(--vw-text-tertiary)]">Historical fundamentals</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] table-fixed border-collapse text-[12px]">
          <thead style={{ background: 'var(--vw-bg-raised)', color: 'var(--vw-text-tertiary)' }}>
            <tr className="border-b" style={{ borderColor: 'var(--vw-border)' }}>
              <th scope="col" className="w-[72px] px-3 py-1.5 text-left text-[10px] font-semibold uppercase">
                Year
              </th>
              {HISTORY_MONEY_FIELDS.map((field) => (
                <th key={field.id} scope="col" className="w-[118px] px-2 py-1.5 text-right text-[10px] font-semibold uppercase">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--vw-border-dim)' }}>
            {stock.history.map((year) => (
              <tr key={year.year}>
                <th scope="row" className="px-3 py-1.5 text-left font-mono text-[12px] font-semibold">
                  {year.year}
                </th>
                {HISTORY_MONEY_FIELDS.map((field) => (
                  <td key={field.id} className="px-2 py-1.5 text-right font-mono tabular-nums">
                    {formatHistoryMoney(year[field.id as HistoryMoneyField])}
                  </td>
                ))}
              </tr>
            ))}
            {stock.history.length === 0 && (
              <tr>
                <td
                  colSpan={HISTORY_MONEY_FIELDS.length + 1}
                  className="px-3 py-8 text-center text-sm text-[var(--vw-text-tertiary)]"
                >
                  No historical fundamentals available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
