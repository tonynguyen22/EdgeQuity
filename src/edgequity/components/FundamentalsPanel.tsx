import { useEffect, useState } from 'react';

import {
  fetchFundamentalsCharts,
  formatFundamentalsValue,
  latestPoint,
  type FundamentalsChartsDocument,
} from '../fundamentals-charts';

import MetricTrendChart from './MetricTrendChart';

interface FundamentalsPanelProps {
  ticker: string;
}

export default function FundamentalsPanel({ ticker }: FundamentalsPanelProps) {
  const [document, setDocument] = useState<FundamentalsChartsDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDocument(null);

    fetchFundamentalsCharts(ticker)
      .then((payload) => {
        if (!cancelled) setDocument(payload);
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load fundamentals charts');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (loading) {
    return (
      <section className="vw-card eq-fundamentals-panel px-4 py-8 text-center text-sm text-[var(--vw-text-secondary)]">
        Loading fundamentals charts…
      </section>
    );
  }

  if (error) {
    return (
      <section className="vw-card eq-fundamentals-panel px-4 py-8 text-center text-sm text-[var(--vw-text-secondary)]">
        {error}
      </section>
    );
  }

  if (!document || document.sections.length === 0) {
    return (
      <section className="vw-card eq-fundamentals-panel px-4 py-8 text-center text-sm text-[var(--vw-text-secondary)]">
        No fundamentals chart cache for {ticker}. Run: npm run edgequity:fundamentals-charts
      </section>
    );
  }

  return (
    <div className="eq-fundamentals-stack">
      {document.sections.map((section) => (
        <section key={section.id} className="vw-card eq-fundamentals-section">
          <header className="eq-fundamentals-section-head">
            <h3>{section.title}</h3>
            <p>{section.description}</p>
          </header>

          <div className="eq-fundamentals-metrics">
            {section.metrics.map((metric) => {
              const latest = latestPoint(metric);
              const yLabel =
                metric.format === 'percent' ? '%' : metric.format === 'multiple' ? 'Multiple' : 'USD';

              return (
                <article key={metric.id} className="eq-fundamentals-metric-card">
                  <div className="eq-fundamentals-metric-head">
                    <div>
                      <h4>{metric.label}</h4>
                      <p>{metric.description}</p>
                    </div>
                    {latest && (
                      <div className="eq-fundamentals-latest">
                        <span>Latest</span>
                        <strong>{formatFundamentalsValue(latest.value, metric.format)}</strong>
                        <em>{latest.period}</em>
                      </div>
                    )}
                  </div>

                  <div className="eq-fundamentals-chart-grid">
                    <MetricTrendChart
                      title={metric.label}
                      cadence="Annual"
                      points={metric.annual}
                      format={metric.format}
                      yAxisLabel={yLabel}
                    />
                    <MetricTrendChart
                      title={metric.label}
                      cadence="Quarterly"
                      points={metric.quarterly}
                      format={metric.format}
                      yAxisLabel={yLabel}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
