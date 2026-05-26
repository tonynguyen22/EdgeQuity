import { useState } from 'react';

import { EDGEQUITY_COLUMNS, formatEdgequityValue, getColumnValue } from '../metrics';
import type { EdgequityColumn, EdgequityMetricGroup, EdgequityStockRecord } from '../types';

import FundamentalsPanel from './FundamentalsPanel';

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
  { id: 'margin', label: 'Margin' },
  { id: 'profitability', label: 'Profitability' },
  { id: 'growth', label: 'Growth' },
  { id: 'financialHealth', label: 'Financial health' },
  { id: 'cashFlow', label: 'Cash flow' },
  { id: 'dividends', label: 'Dividends' },
];

function getGroupColumns(group: EdgequityMetricGroup): EdgequityColumn[] {
  return EDGEQUITY_COLUMNS.filter((column) => column.group === group);
}

export default function StockDetail({ stock, onBack }: StockDetailProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'financials' | 'fundamentals'>('analysis');
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

      <div className="eq-detail-tabs" role="tablist" aria-label={`${stock.ticker} detail views`}>
        <button
          type="button"
          role="tab"
          id="edgequity-analysis-tab"
          aria-controls="edgequity-analysis-panel"
          aria-selected={activeTab === 'analysis'}
          className={activeTab === 'analysis' ? 'is-active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          AI Analysis
        </button>
        <button
          type="button"
          role="tab"
          id="edgequity-financials-tab"
          aria-controls="edgequity-financials-panel"
          aria-selected={activeTab === 'financials'}
          className={activeTab === 'financials' ? 'is-active' : ''}
          onClick={() => setActiveTab('financials')}
        >
          Financials
        </button>
        <button
          type="button"
          role="tab"
          id="edgequity-fundamentals-tab"
          aria-controls="edgequity-fundamentals-panel"
          aria-selected={activeTab === 'fundamentals'}
          className={activeTab === 'fundamentals' ? 'is-active' : ''}
          onClick={() => setActiveTab('fundamentals')}
        >
          Fundamentals
        </button>
      </div>

      <section
        id="edgequity-analysis-panel"
        role="tabpanel"
        aria-labelledby="edgequity-analysis-tab"
        hidden={activeTab !== 'analysis'}
      >
        <AnalysisPanel stock={stock} />
      </section>

      <section
        id="edgequity-financials-panel"
        role="tabpanel"
        aria-labelledby="edgequity-financials-tab"
        hidden={activeTab !== 'financials'}
      >
        <FinancialsOverview stock={stock} />
      </section>

      <section
        id="edgequity-fundamentals-panel"
        role="tabpanel"
        aria-labelledby="edgequity-fundamentals-tab"
        hidden={activeTab !== 'fundamentals'}
      >
        <FundamentalsPanel stock={stock} />
      </section>
    </div>
  );
}

function AnalysisPanel({ stock }: { stock: EdgequityStockRecord }) {
  return (
    <article className="eq-analysis-panel">
      <div>
        <p className="text-xs font-semibold uppercase text-[var(--vw-accent)]">AI Analysis</p>
        <h3 className="mt-1 text-lg font-semibold">{stock.ticker} research workflow</h3>
      </div>
      <div className="eq-coming-soon-panel">
        <strong>Coming Soon</strong>
        <p>
          Full research reports are paused while the new earnings transcript and financial statement workflow is rebuilt.
          Financials and Fundamentals are available now.
        </p>
      </div>
    </article>
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

function FinancialsOverview({ stock }: { stock: EdgequityStockRecord }) {
  const latestYear = stock.history[0];
  const latestYearLabel = latestYear?.year ?? 'Latest period';
  const summaryMetrics = [
    { label: 'Latest reported year', value: latestYear?.year ?? '-', caption: 'Statement period' },
    { label: 'Revenue', value: formatEdgequityValue(latestYear?.revenue ?? null, 'money'), caption: 'Business scale' },
    { label: 'Gross Profit', value: formatEdgequityValue(latestYear?.grossProfit ?? null, 'money'), caption: 'After direct costs' },
    { label: 'Operating Income', value: formatEdgequityValue(latestYear?.operatingIncome ?? null, 'money'), caption: 'Core profit' },
    { label: 'Net Income', value: formatEdgequityValue(latestYear?.netIncome ?? null, 'money'), caption: 'Bottom-line earnings' },
    { label: 'Free Cash Flow', value: formatEdgequityValue(latestYear?.freeCashFlow ?? null, 'money'), caption: 'Cash after capex' },
  ];
  const financialSections = [
    {
      title: 'Profitability',
      metrics: [
        { label: 'Gross Margin', value: formatEdgequityValue(stock.profitability.grossMargin, 'percent') },
        { label: 'Operating Margin', value: formatEdgequityValue(stock.profitability.operatingMargin, 'percent') },
        { label: 'Net Margin', value: formatEdgequityValue(stock.profitability.netMargin, 'percent') },
        { label: 'ROE', value: formatEdgequityValue(stock.profitability.roe, 'percent') },
        { label: 'ROIC', value: formatEdgequityValue(stock.profitability.roic, 'percent') },
      ],
    },
    {
      title: 'Cash generation',
      metrics: [
        { label: 'Operating Cash Flow', value: formatEdgequityValue(stock.cashFlow.operatingCashFlow, 'money') },
        { label: 'Free Cash Flow', value: formatEdgequityValue(stock.cashFlow.freeCashFlow, 'money') },
        { label: 'FCF Margin', value: formatEdgequityValue(stock.cashFlow.fcfMargin, 'percent') },
        { label: 'FCF Conversion', value: formatEdgequityValue(stock.cashFlow.fcfConversion, 'percent') },
        { label: 'Capex / Revenue', value: formatEdgequityValue(stock.cashFlow.capexToRevenue, 'percent') },
      ],
    },
    {
      title: 'Capital structure',
      metrics: [
        { label: 'Market Cap', value: formatEdgequityValue(stock.marketCap, 'money') },
        { label: 'Enterprise Value', value: formatEdgequityValue(stock.enterpriseValue, 'money') },
        { label: 'Total Debt', value: formatEdgequityValue(latestYear?.totalDebt ?? null, 'money') },
        { label: 'Total Equity', value: formatEdgequityValue(latestYear?.totalEquity ?? null, 'money') },
        { label: 'Shares Diluted', value: formatShareCount(latestYear?.sharesDiluted ?? null) },
      ],
    },
    {
      title: 'Growth and balance sheet',
      metrics: [
        { label: 'Revenue CAGR 3Y', value: formatEdgequityValue(stock.growth.revenueCagr3y, 'percent') },
        { label: 'Revenue CAGR 5Y', value: formatEdgequityValue(stock.growth.revenueCagr5y, 'percent') },
        { label: 'FCF CAGR 3Y', value: formatEdgequityValue(stock.growth.fcfCagr3y, 'percent') },
        { label: 'Current Ratio', value: formatEdgequityValue(stock.financialHealth.currentRatio, 'number') },
        { label: 'Net Debt / EBITDA', value: formatEdgequityValue(stock.financialHealth.netDebtToEbitda, 'multiple') },
      ],
    },
  ];

  return (
    <div className="eq-financials-overview">
      <section className="eq-financials-summary">
        <div className="eq-financials-summary-head">
          <div>
            <p>Financial snapshot</p>
            <h3>{stock.ticker} operating profile</h3>
          </div>
          <span>{latestYearLabel}</span>
        </div>

        <div className="eq-financials-kpi-grid">
          {summaryMetrics.map((metric) => (
            <FinancialMetricCard key={metric.label} label={metric.label} value={metric.value} caption={metric.caption} />
          ))}
        </div>
      </section>

      <section className="eq-financials-section-grid">
        {financialSections.map((section) => (
          <article className="eq-financials-section" key={section.title}>
            <h3>{section.title}</h3>
            <dl>
              {section.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>

      <section className="eq-financials-metric-groups">
        <div className="eq-financials-subhead">
          <p>Screener metrics</p>
          <span>Same fields used in the main comparison table.</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {METRIC_GROUPS.map((group) => (
            <MetricGroupCard key={group.id} stock={stock} group={group} />
          ))}
        </div>
      </section>
    </div>
  );
}

function FinancialMetricCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  const isMissing = value === '-';

  return (
    <article className="eq-financials-kpi">
      <p>{label}</p>
      <strong className={isMissing ? 'is-missing' : ''}>{value}</strong>
      <span>{caption}</span>
    </article>
  );
}

function formatShareCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(2)}B`;
  }

  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
  }

  return `${sign}${absValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
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
