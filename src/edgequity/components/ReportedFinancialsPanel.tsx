import { useMemo, useState } from 'react';

import {
  buildReportedFinancialsFromStock,
  formatReportedMoney,
  formatSecSourceLine,
  getAvailableStatements,
  getReportedStatementLabel,
  getStatementPivot,
  type ReportedStatementId,
} from '../reported-financials';
import type { EdgequityStockRecord } from '../types';

interface ReportedFinancialsPanelProps {
  stock: EdgequityStockRecord;
}

export default function ReportedFinancialsPanel({ stock }: ReportedFinancialsPanelProps) {
  const document = useMemo(() => buildReportedFinancialsFromStock(stock), [stock]);
  const availableStatements = useMemo(() => getAvailableStatements(document), [document]);
  const [statementId, setStatementId] = useState<ReportedStatementId>('ic');
  const activeStatementId = availableStatements.includes(statementId) ? statementId : availableStatements[0] ?? 'ic';
  const pivot = getStatementPivot(document, activeStatementId);
  const sourceTitle = document.source === 'fmp' ? 'Statements (FMP)' : 'Statements';
  const sourceName = document.source === 'fmp' ? 'Financial Modeling Prep' : 'Static summary';

  if (document.status !== 'ok' || pivot.years.length === 0) {
    return (
      <section className="vw-card eq-reported-panel px-4 py-8 text-center text-sm text-[var(--vw-text-secondary)]">
        No statement data is available for {stock.ticker}.
      </section>
    );
  }

  return (
    <section className="vw-card eq-reported-panel overflow-hidden">
      <header className="border-b px-3 py-2" style={{ borderColor: 'var(--vw-border)' }}>
        <h3 className="text-xs font-semibold uppercase text-[var(--vw-text-tertiary)]">{sourceTitle}</h3>
        <p className="mt-1 text-sm text-[var(--vw-text-secondary)]">
          {document.entityName ?? stock.ticker} - Source: {sourceName} - {formatSecSourceLine(document)}
        </p>
      </header>

      <div className="eq-reported-toolbar">
        {availableStatements.map((id) => (
          <button
            key={id}
            type="button"
            className={activeStatementId === id ? 'is-active' : ''}
            onClick={() => setStatementId(id)}
          >
            {getReportedStatementLabel(id)}
          </button>
        ))}
        <span className="eq-reported-meta">Up to {pivot.years.length} fiscal years</span>
      </div>

      <div className="eq-reported-table-wrap overflow-x-auto">
        <table className="eq-reported-table">
          <thead>
            <tr>
              <th scope="col" className="eq-reported-label-col">
                Line item
              </th>
              {pivot.years.map((year) => (
                <th key={year} scope="col" className="eq-reported-year-col">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pivot.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="eq-reported-label-col" title={row.key}>
                  {row.label}
                </th>
                {pivot.years.map((year) => (
                  <td key={`${row.key}-${year}`} className="eq-reported-value-col">
                    {formatReportedMoney(row.valuesByYear[year] ?? null, row.unit)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
