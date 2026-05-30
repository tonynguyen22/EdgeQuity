import { useEffect, useState } from 'react';

import {
  buildFundamentalsChartsFromStock,
  fetchFundamentalsCharts,
  formatFundamentalsValue,
  latestPoint,
  type FundamentalsChartsDocument,
} from '../fundamentals-charts';
import { coalesceFundamentalsChartsDocument } from '../standardize-financials';
import type { EdgequityStockRecord } from '../types';

import MetricTrendChart from './MetricTrendChart';

interface FundamentalsPanelProps {
  stock: EdgequityStockRecord;
}

export default function FundamentalsPanel({ stock }: FundamentalsPanelProps) {
  const useEmbeddedFmpCharts = stock.financialStatements?.source.provider === 'fmp';
  const [document, setDocument] = useState<FundamentalsChartsDocument | null>(() =>
    useEmbeddedFmpCharts ? buildFundamentalsChartsFromStock(stock) : null,
  );
  const [loading, setLoading] = useState(!useEmbeddedFmpCharts);

  useEffect(() => {
    if (useEmbeddedFmpCharts) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const cached = await fetchFundamentalsCharts(stock.ticker);
        if (!cancelled) {
          setDocument(coalesceFundamentalsChartsDocument(stock, cached));
        }
      } catch {
        if (!cancelled) {
          setDocument(buildFundamentalsChartsFromStock(stock));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [stock, useEmbeddedFmpCharts]);

  if (loading) {
    return (
      <section className="vw-card eq-fundamentals-panel px-4 py-8 text-center text-sm text-[var(--vw-text-secondary)]">
        Loading fundamentals for {stock.ticker}…
      </section>
    );
  }

  if (!document || document.sections.length === 0) {
    return (
      <section className="vw-card eq-fundamentals-panel px-4 py-8 text-center text-sm text-[var(--vw-text-secondary)]">
        No fundamentals data is available for {stock.ticker}.
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
              const hasAnnual = metric.annual.length > 0;
              const hasQuarterly = metric.quarterly.length > 0;
              const chartCount = Number(hasAnnual) + Number(hasQuarterly);

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

                  <div className={`eq-fundamentals-chart-grid${chartCount <= 1 ? ' is-single' : ''}`}>
                    {hasAnnual && (
                      <MetricTrendChart
                        title={metric.label}
                        cadence="Annual"
                        points={metric.annual}
                        format={metric.format}
                        yAxisLabel={yLabel}
                      />
                    )}
                    {hasQuarterly && (
                      <MetricTrendChart
                        title={metric.label}
                        cadence="Quarterly"
                        points={metric.quarterly}
                        format={metric.format}
                        yAxisLabel={yLabel}
                      />
                    )}
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
