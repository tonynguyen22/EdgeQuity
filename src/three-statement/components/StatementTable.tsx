import type { ForecastRow } from '../types';

interface StatementTableField {
  label: string;
  key: keyof ForecastRow;
  isPercent?: boolean;
  isBold?: boolean;
  isDivider?: boolean;
}

interface StatementTableProps {
  rows: ForecastRow[];
  fields: StatementTableField[];
}

const fmt = (v: number, divisor = 1e6) => {
  const val = v / divisor;
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}B`;
  return `${val.toFixed(0)}M`;
};

export default function StatementTable({ rows, fields }: StatementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr>
            <th className="text-left pb-3 pr-6 text-slate-500 font-medium sticky left-0 bg-[var(--vw-bg-surface)] z-10 min-w-[160px]">Line Item</th>
            {rows.map(r => (
              <th key={r.year} className={`pb-3 px-3 text-right min-w-[80px] ${r.isProjected ? 'text-cyan-400' : 'text-slate-400'}`}>
                {r.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map(({ label, key, isPercent, isBold, isDivider }) => (
            <tr key={label} className={`${isDivider ? 'border-t border-slate-700/50' : ''}`}>
              <td className={`py-1.5 pr-6 sticky left-0 bg-[var(--vw-bg-surface)] z-10 ${isBold ? 'text-slate-200 font-semibold' : 'text-slate-500'}`}>
                {label}
              </td>
              {rows.map(r => {
                const v = r[key] as number;
                return (
                  <td key={r.year} className={`py-1.5 px-3 text-right ${r.isProjected ? 'text-slate-200' : 'text-slate-400'} ${isBold ? 'font-semibold' : ''}`}>
                    {isPercent ? `${v.toFixed(1)}%` : fmt(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
