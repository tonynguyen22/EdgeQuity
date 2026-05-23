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
  const chartPoints = useMemo(() => normalizeChartPoints(points), [points]);
  const periodLabel = cadence === 'Annual' ? '5Y' : '5Q';
  const layout = useMemo(() => buildChartLayout(chartPoints), [chartPoints]);

  if (chartPoints.length === 0) {
    return (
      <article className="eq-fundamentals-chart">
        <header className="eq-fundamentals-chart-head">
          <h5>{title}</h5>
          <span>{periodLabel}</span>
        </header>
        <p className="eq-fundamentals-chart-empty">No data</p>
      </article>
    );
  }

  return (
    <article className="eq-fundamentals-chart">
      <header className="eq-fundamentals-chart-head">
        <h5>{title}</h5>
        <span>{periodLabel}</span>
      </header>
      <div className="eq-fundamentals-chart-axis-strip">
        <span>Y: {yAxisLabel}</span>
        <span>X: {xAxisLabel}</span>
      </div>
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={`${title} ${cadence} chart`}>
        <text className="eq-fundamentals-chart-y" x={layout.yAxisX} y={layout.top + 4} textAnchor="end">
          {formatAxisValue(layout.max, format)}
        </text>
        <text className="eq-fundamentals-chart-y" x={layout.yAxisX} y={layout.mid + 4} textAnchor="end">
          {formatAxisValue(layout.midValue, format)}
        </text>
        <text className="eq-fundamentals-chart-y" x={layout.yAxisX} y={layout.bottom + 4} textAnchor="end">
          {formatAxisValue(layout.min, format)}
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
          <text
            className="eq-fundamentals-chart-x"
            key={label.period}
            x={label.x}
            y={layout.xLabelY}
            textAnchor="middle"
          >
            {formatPeriodLabel(label.period)}
          </text>
        ))}
      </svg>
    </article>
  );
}

function formatAxisValue(value: number, format: FundamentalsFormat): string {
  if (!Number.isFinite(value)) return '-';
  if (format === 'money') {
    const abs = Math.abs(value);
    const prefix = value < 0 ? '-$' : '$';
    if (abs >= 1_000_000_000) return `${prefix}${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(0)}M`;
    if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(0)}K`;
    return `${prefix}${abs.toFixed(0)}`;
  }
  if (format === 'percent') return `${value.toFixed(0)}%`;
  if (format === 'multiple') return `${value.toFixed(1)}x`;
  if (format === 'perShare') return `$${value.toFixed(1)}`;
  return String(value);
}

function formatPeriodLabel(period: string): string {
  const quarter = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) return `'${quarter[1]!.slice(-2)} Q${quarter[2]}`;
  return period.length > 6 ? period.slice(0, 6) : period;
}

function normalizeChartPoints(points: FundamentalsChartPoint[]) {
  return points
    .filter((point) => Number.isFinite(point.value))
    .slice()
    .sort((left, right) => comparePeriods(left.period, right.period))
    .slice(-5);
}

function comparePeriods(left: string, right: string) {
  const leftRank = periodRank(left);
  const rightRank = periodRank(right);
  return leftRank - rightRank;
}

function periodRank(period: string) {
  const quarter = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) return Number(quarter[1]) * 4 + Number(quarter[2]);

  const year = period.match(/^(\d{4})$/);
  if (year) return Number(year[1]) * 4;

  return Number.MAX_SAFE_INTEGER;
}

function buildChartLayout(points: FundamentalsChartPoint[]) {
  const width = 520;
  const height = 260;
  const left = 76;
  const right = width - 20;
  const top = 22;
  const bottom = 196;
  const xLabelY = height - 26;
  const yAxisX = left - 10;
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

  const labelBudget = points.length <= 8 ? points.length : 6;
  const xLabels = plotPoints.filter((_, index) => {
    if (points.length <= labelBudget) return true;
    const step = Math.ceil(points.length / labelBudget);
    return index % step === 0 || index === points.length - 1;
  });

  return {
    width,
    height,
    left,
    right,
    top,
    mid,
    bottom,
    xLabelY,
    yAxisX,
    min,
    max,
    midValue,
    polyline: plotPoints.map((point) => `${point.x},${point.y}`).join(' '),
    plotPoints,
    xLabels,
  };
}
