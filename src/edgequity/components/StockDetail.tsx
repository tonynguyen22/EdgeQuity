import { useEffect, useState } from 'react';

import { buildCompanyDescriptionFallback, fetchFinnhubSnapshot } from '../finnhub-analysis';
import { EDGEQUITY_COLUMNS, formatEdgequityValue, getColumnValue } from '../metrics';
import type { EdgequityColumn, EdgequityFinnhubSnapshot, EdgequityMetricGroup, EdgequityStockRecord } from '../types';

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
  const [snapshot, setSnapshot] = useState<EdgequityFinnhubSnapshot | null>(null);
  const [snapshotStatus, setSnapshotStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const sectorLine = [stock.sector, stock.industry].filter(Boolean).join(' / ') || 'Classification unavailable';

  useEffect(() => {
    let cancelled = false;
    setSnapshotStatus('loading');
    setSnapshot(null);

    fetchFinnhubSnapshot(stock.ticker)
      .then((nextSnapshot) => {
        if (cancelled) return;
        setSnapshot(nextSnapshot);
        setSnapshotStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setSnapshotStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [stock.ticker]);

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
        <AnalysisPanel stock={stock} snapshot={snapshot} snapshotStatus={snapshotStatus} />
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

function AnalysisPanel({
  stock,
  snapshot,
  snapshotStatus,
}: {
  stock: EdgequityStockRecord;
  snapshot: EdgequityFinnhubSnapshot | null;
  snapshotStatus: 'idle' | 'loading' | 'ready' | 'error';
}) {
  const profile = snapshot?.profile;
  const quote = snapshot?.quote;
  const companyName = profile?.name ?? stock.name;
  const exchange = profile?.exchange ?? 'Exchange loading';
  const industry = profile?.finnhubIndustry ?? stock.industry ?? 'Industry loading';
  const country = profile?.country ?? 'Country loading';
  const currency = profile?.currency ?? stock.currency ?? 'USD';
  const currentPrice = quote?.c ?? stock.price;
  const previousClose = quote?.pc ?? null;
  const marketCap =
    typeof profile?.marketCapitalization === 'number'
      ? profile.marketCapitalization * 1_000_000
      : stock.marketCap;
  const description = profile
    ? buildCompanyDescriptionFallback(profile)
    : `${stock.name} profile is loading from Finnhub.`;
  const dataStatus =
    snapshotStatus === 'ready' ? 'Finnhub cached' : snapshotStatus === 'error' ? 'Static fallback' : 'Loading';
  const dailyChange = formatDailyChange(quote?.d, quote?.dp);
  const dailyChangeClass =
    typeof quote?.d === 'number' && quote.d < 0 ? 'is-down' : typeof quote?.d === 'number' && quote.d > 0 ? 'is-up' : '';

  return (
    <article className="eq-analysis-stack">
      <section className="eq-analysis-company-header">
        <div className="eq-analysis-company-kicker">
          <span>Company Profile</span>
          <strong>{stock.ticker}</strong>
        </div>
        <div className="eq-analysis-company-body">
          <div>
            <h3>{companyName}</h3>
            <p>{description}</p>
          </div>
          <dl className="eq-analysis-company-meta" aria-label={`${stock.ticker} company identity`}>
            <div>
              <dt>Exchange</dt>
              <dd>{exchange}</dd>
            </div>
            <div>
              <dt>Industry</dt>
              <dd>{industry}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{country}</dd>
            </div>
          </dl>
        </div>
      </section>

      <dl className="eq-analysis-price-hero" aria-label={`${stock.ticker} price summary`}>
        <PriceHeroMetric
          label="Current Price"
          value={`${currency} ${formatEdgequityValue(currentPrice, 'number')}`}
          detail={dailyChange}
          detailClassName={dailyChangeClass}
          prominent
        />
        <PriceHeroMetric label="Previous Close" value={formatEdgequityValue(previousClose, 'number')} />
        <PriceHeroMetric label="Market Cap" value={formatEdgequityValue(marketCap, 'money')} />
        <PriceHeroMetric label="Data Status" value={dataStatus} textValue />
      </dl>
    </article>
  );
}

function PriceHeroMetric({
  label,
  value,
  detail,
  detailClassName = '',
  prominent = false,
  textValue = false,
}: {
  label: string;
  value: string;
  detail?: string;
  detailClassName?: string;
  prominent?: boolean;
  textValue?: boolean;
}) {
  return (
    <div className={prominent ? 'is-prominent' : ''}>
      <dt>{label}</dt>
      <dd className={textValue ? 'is-text' : ''}>{value}</dd>
      {detail ? <span className={detailClassName}>{detail}</span> : null}
    </div>
  );
}

function formatDailyChange(change: number | undefined, changePercent: number | undefined): string | undefined {
  if (typeof change !== 'number' || typeof changePercent !== 'number') {
    return undefined;
  }

  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
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
