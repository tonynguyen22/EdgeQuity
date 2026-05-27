import { useEffect, useMemo, useState } from 'react';

import {
  buildAnalysisChartSeries,
  buildCompanyDescriptionFallback,
  fetchFinnhubSnapshot,
  type FinnhubAnalysisCadence,
} from '../finnhub-analysis';
import {
  buildFundamentalsChartsFromStock,
  formatFundamentalsValue,
  latestPoint,
  type FundamentalsChartMetric,
} from '../fundamentals-charts';
import { formatEdgequityValue } from '../metrics';
import type { EdgequityFinnhubSnapshot, EdgequityStockRecord } from '../types';

import MetricTrendChart from './MetricTrendChart';

interface StockDetailProps {
  stock: EdgequityStockRecord;
  onBack: () => void;
  initialFinnhubSnapshot?: EdgequityFinnhubSnapshot | null;
}

export default function StockDetail({ stock, onBack, initialFinnhubSnapshot = null }: StockDetailProps) {
  const [snapshot, setSnapshot] = useState<EdgequityFinnhubSnapshot | null>(initialFinnhubSnapshot);
  const [snapshotStatus, setSnapshotStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    initialFinnhubSnapshot ? 'ready' : 'idle',
  );
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

      <AnalysisPanel stock={stock} snapshot={snapshot} snapshotStatus={snapshotStatus} />
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
  const website = profile?.weburl ?? null;
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
        <div className="eq-analysis-company-kicker">Company Profile</div>
        <div className="eq-analysis-symbol-row">
          <strong>{stock.ticker}</strong>
          <span>- {companyName}</span>
        </div>
        <p className="eq-analysis-listing-line">
          {exchange} · {industry} · {country}
          {website ? (
            <>
              {' · '}
              <a href={website} target="_blank" rel="noreferrer">Company website -&gt;</a>
            </>
          ) : null}
        </p>
        <p className="eq-analysis-company-description">{description}</p>
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

      <AnalysisFundamentals stock={stock} snapshot={snapshot} />
    </article>
  );
}

const FINNHUB_RATIO_METRIC_IDS = new Set(['grossMargin', 'operatingMargin', 'netMargin', 'fcfMargin']);

function AnalysisFundamentals({ stock, snapshot }: { stock: EdgequityStockRecord; snapshot: EdgequityFinnhubSnapshot | null }) {
  const document = useMemo(() => buildFundamentalsChartsFromStock(stock), [stock]);
  const metrics = useMemo(
    () => document.sections.flatMap((section) => section.metrics).map((metric) => enrichMetricWithFinnhubSnapshot(metric, snapshot)),
    [document.sections, snapshot],
  );
  const metricNames = metrics.map((metric) => metric.label).slice(0, 8).join(' · ');

  if (metrics.length === 0) {
    return (
      <section className="eq-analysis-fundamentals" aria-label="Fundamental analysis">
        <header className="eq-analysis-fundamentals-title">
          <span>1</span>
          <div>
            <h4>Fundamentals</h4>
            <p>Normalized annual and quarterly statement charts are not available for this ticker yet.</p>
          </div>
        </header>
      </section>
    );
  }

  return (
    <section className="eq-analysis-fundamentals" aria-label="Fundamental analysis">
      <header className="eq-analysis-fundamentals-title">
        <span>1</span>
        <div>
          <h4>Fundamentals</h4>
          <p>
            Sector: {stock.sector ?? 'Unclassified'} · Metrics: {metricNames}
          </p>
        </div>
      </header>

      <div className="eq-analysis-metric-pair-stack">
        {metrics.map((metric, index) => (
          <AnalysisMetricPair key={metric.id} metric={metric} index={index} />
        ))}
      </div>
    </section>
  );
}

function enrichMetricWithFinnhubSnapshot(
  metric: FundamentalsChartMetric,
  snapshot: EdgequityFinnhubSnapshot | null,
): FundamentalsChartMetric {
  if (!snapshot || !FINNHUB_RATIO_METRIC_IDS.has(metric.id)) return metric;

  const annual = buildFinnhubRatioPoints(snapshot, metric.id, 'annual', 5);
  const quarterly = buildFinnhubRatioPoints(snapshot, metric.id, 'quarterly', 20);

  return {
    ...metric,
    annual: annual.length > 0 ? annual : metric.annual,
    quarterly: quarterly.length > 0 ? quarterly : metric.quarterly,
  };
}

function buildFinnhubRatioPoints(
  snapshot: EdgequityFinnhubSnapshot,
  ratioId: string,
  cadence: FinnhubAnalysisCadence,
  limit: number,
) {
  return buildAnalysisChartSeries(snapshot, ratioId, cadence, limit).map((point) => ({
    ...point,
    period: cadence === 'quarterly' ? finnHubDateToQuarter(point.period) : point.period.slice(0, 4),
    value: normalizeFinnhubPercent(point.value),
  }));
}

function finnHubDateToQuarter(period: string): string {
  const year = Number.parseInt(period.slice(0, 4), 10);
  const month = Number.parseInt(period.slice(5, 7), 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return period;
  const quarter = month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';
  return `${year}-${quarter}`;
}

function normalizeFinnhubPercent(value: number): number {
  return Math.abs(value) <= 1.5 ? value * 100 : value;
}

function AnalysisMetricPair({ metric, index }: { metric: FundamentalsChartMetric; index: number }) {
  const latest = latestPoint(metric);
  const yAxisLabel = metric.format === 'percent' ? '%' : metric.format === 'multiple' ? 'Multiple' : 'USD';

  return (
    <article className="eq-analysis-metric-pair-card">
      <header className="eq-analysis-metric-pair-head">
        <div>
          <h5>{metricPrefix(index)}. {metric.label}</h5>
          <p>{metric.description}</p>
        </div>
        {latest ? (
          <div className="eq-analysis-latest-pill">
            <span>Latest</span>
            <strong>{formatFundamentalsValue(latest.value, metric.format)}</strong>
            <em>{latest.period}</em>
          </div>
        ) : null}
      </header>

      <div className="eq-analysis-chart-pair">
        <MetricTrendChart
          title={`${metric.label} Annual`}
          cadence="Annual"
          format={metric.format}
          points={metric.annual}
          yAxisLabel={yAxisLabel}
          variant="bar"
          maxPoints={5}
        />
        <MetricTrendChart
          title={`${metric.label} Quarterly`}
          cadence="Quarterly"
          format={metric.format}
          points={metric.quarterly}
          yAxisLabel={yAxisLabel}
          maxPoints={20}
        />
      </div>
    </article>
  );
}

function metricPrefix(index: number): string {
  return String.fromCharCode(65 + index);
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
