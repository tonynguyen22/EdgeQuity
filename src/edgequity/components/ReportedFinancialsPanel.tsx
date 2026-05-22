import { useEffect, useMemo, useState } from 'react';

import {
  fetchReportedFinancials,
  formatReportedMoney,
  formatSecSourceLine,
  getAvailableStatements,
  getReportedStatementLabel,
  getStatementPivot,
  type ReportedStatementId,
  type SecStatementsDocument,
} from '../reported-financials';

interface ReportedFinancialsPanelProps {
  ticker: string;
}

export default function ReportedFinancialsPanel({ ticker }: ReportedFinancialsPanelProps) {
  const [document, setDocument] = useState<SecStatementsDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statementId, setStatementId] = useState<ReportedStatementId>('ic');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDocument(null);

    fetchReportedFinancials(ticker)
      .then((payload) => {
        if (cancelled) return;
        setDocument(payload);
        const available = getAvailableStatements(payload);
        setStatementId((current) => (available.includes(current) ? current : available[0] ?? 'ic'));
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load SEC financial statements');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const availableStatements = useMemo(
    () => (document ? getAvailableStatements(document) : []),
    [document],
  );

  const pivot = useMemo(() => {
    if (!document || availableStatements.length === 0) return null;
    return getStatementPivot(document, statementId);
  }, [document, statementId, availableStatements.length]);

  if (loading) {
    return (
      <section className="vw-card eq-reported-panel px-4 py-8 text-center text-sm text-[var(--vw-text-secondary)]">
        Loading SEC financial statements…
      </section>
    );
  }

  if (error) {
    return (
      <section className="vw-card eq-reported-panel px-4 py-8 text-center text-sm text-[var(--vw-text-secondary)]">
        {error}
      </section>
    );
  }

  if (!document || document.status !== 'ok' || !pivot || pivot.years.length === 0) {
    const hint =
      document?.status === 'no_cik'
        ? `${ticker} is not registered with the SEC (no CIK). BCTC may only exist on the home exchange (e.g. TSX for Canadian banks).`
        : `No SEC XBRL data cached for ${ticker}. Run: npm run edgequity:sec-statements`;
    return (
      <section className="vw-card eq-reported-panel px-4 py-8 text-center text-sm text-[var(--vw-text-secondary)]">
        {hint}
      </section>
    );
  }

  return (
    <section className="vw-card eq-reported-panel overflow-hidden">
      <header className="border-b px-3 py-2" style={{ borderColor: 'var(--vw-border)' }}>
        <h3 className="text-xs font-semibold uppercase text-[var(--vw-text-tertiary)]">Statements (SEC)</h3>
        <p className="mt-1 text-sm text-[var(--vw-text-secondary)]">
          {document.entityName ?? ticker} · Source: SEC EDGAR · {formatSecSourceLine(document)}
        </p>
      </header>

      <div className="eq-reported-toolbar">
        {availableStatements.map((id) => (
          <button
            key={id}
            type="button"
            className={statementId === id ? 'is-active' : ''}
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
