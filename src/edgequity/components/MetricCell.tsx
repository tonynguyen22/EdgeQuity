import type { EdgequityColumn, EdgequityStockRecord } from '../types';
import { formatEdgequityValue, getColumnValue } from '../metrics';

interface MetricCellProps {
  stock: EdgequityStockRecord;
  column: EdgequityColumn;
  groupStart?: boolean;
}

export default function MetricCell({ stock, column, groupStart = false }: MetricCellProps) {
  const value = getColumnValue(stock, column);
  const formattedValue = formatEdgequityValue(value, column.format);
  const isText = column.format === 'text';
  const isMissing = formattedValue === '-';
  const isSticky = column.id === 'ticker' || column.id === 'name';
  const stickyClass = isSticky ? `eq-sticky-col ${column.id === 'name' ? 'eq-sticky-name' : ''}` : '';
  const groupClass = groupStart ? 'eq-group-start' : '';
  const accentClass = getAccentClass(column.id, value);
  const valueClassName = isText
    ? 'text-left font-normal'
    : `text-right font-mono tabular-nums ${isMissing ? 'text-[var(--vw-text-tertiary)]' : accentClass}`;
  const textColor = isMissing
    ? 'var(--vw-text-tertiary)'
    : isText || accentClass.length === 0
      ? 'var(--vw-text-primary)'
      : undefined;

  return (
    <td
      className={`px-2 py-1.5 text-[12px] ${stickyClass} ${groupClass} ${valueClassName}`}
      style={{ color: textColor }}
    >
      <span className={column.id === 'ticker' ? 'font-mono font-semibold text-[var(--vw-accent)]' : ''}>
        {formattedValue}
      </span>
    </td>
  );
}

function getAccentClass(columnId: string, value: string | number | null): string {
  if (typeof value !== 'number') return '';
  if (columnId === 'fcfYield' && value >= 0.03) return 'text-[var(--vw-green)]';
  if ((columnId === 'grossMargin' || columnId === 'operatingMargin' || columnId === 'netMargin') && value >= 0.25) {
    return 'text-[var(--vw-green)]';
  }
  if (columnId === 'debtToEquity' && value > 2) return 'text-[var(--vw-amber)]';
  return '';
}
