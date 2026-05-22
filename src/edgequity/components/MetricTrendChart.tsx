import { useMemo } from 'react';

import { formatFundamentalsValue, type FundamentalsChartPoint, type FundamentalsFormat } from '../fundamentals-charts';

interface MetricTrendChartProps {
  title: string;
  cadence: 'Annual' | 'Quarterly';
  points: FundamentalsChartPoint[];
  format: FundamentalsFormat;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function MetricTrendChart({
  title,
  cadence,
  points,
  format,
  xAxisLabel = 'Reporting period',
  yAxisLabel = 'Value',
}: MetricTrendChartProps) {
  const layout = useMemo(() => buildChartLayout(points), [points]);

  if (points.length === 0) {
    return (
      <article className="eq-fundamentals-chart">
        <header className="eq-fundamentals-chart-head">
          <h5>{title}</h5>
          <span>{cadence}</span>
        </header>
        <p className="eq-fundamentals-chart-empty">No data</p>
      </article>
    );
  }

  return (
    <article className="eq-fundamentals-chart">
      <header className="eq-fundamentals-chart-head">
        <h5>{title}</h5>
        <span>{cadence}</span>
      </header>
      <div className="eq-fundamentals-chart-axis-strip">
        <span>Y: {yAxisLabel}</span>
        <span>X: {xAxisLabel}</span>
      </div>
      <svg viewBox="0 0 320 120" role="img" aria-label={`${title} ${cadence} chart`}>
        <text className="eq-fundamentals-chart-y" x="36" y={layout.top + 4} textAnchor="end">
          {formatFundamentalsValue(layout.max, format)}
        </text>
        <text className="eq-fundamentals-chart-y" x="36" y={layout.mid + 4} textAnchor="end">
          {formatFundamentalsValue(layout.midValue, format)}
        </text>
        <text className="eq-fundamentals-chart-y" x="36" y={layout.bottom + 4} textAnchor="end">
          {formatFundamentalsValue(layout.min, format)}
        </text>
        <line className="eq-fundamentals-chart-grid" x1={layout.left} y1={layout.top} x2={layout.right} y2={layout.top} />
        <line className="eq-fundamentals-chart-grid" x1={layout.left} y1={layout.mid} x2={layout.right} y2={layout.mid} />
        <line x1={layout.left} y1={layout.bottom} x2={layout.right} y2={layout.bottom} stroke="var(--vw-border)" />
        <line x1={layout.left} y1={layout.top} x2={layout.left} y2={layout.bottom} stroke="var(--vw-border)" />
        {layout.polyline && <polyline className="eq-fundamentals-chart-line" points={layout.polyline} />}
        {layout.plotPoints.map((point) => (
          <circle
            className="eq-fundamentals-chart-point"
            key={point.period}
            cx={point.x}
            cy={point.y}
            r="3"
          />
        ))}
        {layout.xLabels.map((label) => (
          <text className="eq-fundamentals-chart-x" key={label.period} x={label.x} y="112" textAnchor="middle">
            {label.period}
          </text>
        ))}
      </svg>
    </article>
  );
}

function buildChartLayout(points: FundamentalsChartPoint[]) {
  const left = 44;
  const right = 300;
  const top = 14;
  const bottom = 88;
  const values = points.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const midValue = min + range / 2;
  const mid = top + (bottom - top) / 2;

  const plotPoints = points.map((point, index) => {
    const x = points.length <= 1 ? left : left + (index / (points.length - 1)) * (right - left);
    const y = bottom - ((point.value - min) / range) * (bottom - top);
    return { period: point.period, x, y };
  });

  const xLabels = plotPoints.filter((_, index) => {
    if (points.length <= 6) return true;
    const step = Math.ceil(points.length / 6);
    return index % step === 0 || index === points.length - 1;
  });

  return {
    left,
    right,
    top,
    mid,
    bottom,
    min,
    max,
    midValue,
    polyline: plotPoints.map((point) => `${point.x},${point.y}`).join(' '),
    plotPoints,
    xLabels,
  };
}
