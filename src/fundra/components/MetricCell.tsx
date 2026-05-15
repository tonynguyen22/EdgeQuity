import type { FundraColumn, FundraStockRecord } from '../types';
import { formatFundraValue, getColumnValue } from '../metrics';

interface MetricCellProps {
  stock: FundraStockRecord;
  column: FundraColumn;
}

export default function MetricCell({ stock, column }: MetricCellProps) {
  const value = getColumnValue(stock, column);
  const formattedValue = formatFundraValue(value, column.format);
  const isMissing = formattedValue === '-';

  return (
    <td
      className="px-3 py-2 text-right font-mono text-sm tabular-nums"
      style={{ color: isMissing ? 'var(--vw-text-tertiary)' : 'var(--vw-text-primary)' }}
    >
      {formattedValue}
    </td>
  );
}
