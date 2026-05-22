export type ReportedStatementId = 'ic' | 'bs' | 'cf';

export interface ReportedStatementRow {
  key: string;
  label: string;
  unit: string;
  valuesByYear: Record<number, number | null>;
}

export interface SecStatementsDocument {
  schemaVersion?: number;
  ticker: string;
  cik: string | null;
  entityName: string | null;
  source: 'sec-edgar';
  fetchedAt: string;
  status: 'ok' | 'no_cik' | 'no_facts';
  recentFilings: Array<{ form: string; filingDate: string; reportDate: string }>;
  statements: Record<ReportedStatementId, { years: number[]; rows: ReportedStatementRow[] }>;
}

const STATEMENT_LABELS: Record<ReportedStatementId, string> = {
  ic: 'Income statement',
  bs: 'Balance sheet',
  cf: 'Cash flow',
};

export function getReportedStatementLabel(id: ReportedStatementId): string {
  return STATEMENT_LABELS[id];
}

export function secStatementsUrl(ticker: string): string {
  return `/data/edgequity/raw/${encodeURIComponent(ticker.toUpperCase())}/sec-statements.json`;
}

export async function fetchReportedFinancials(ticker: string): Promise<SecStatementsDocument> {
  const response = await fetch(secStatementsUrl(ticker));
  if (!response.ok) {
    throw new Error(`SEC statements unavailable for ${ticker} (${response.status})`);
  }
  return (await response.json()) as SecStatementsDocument;
}

export function getAvailableStatements(document: SecStatementsDocument): ReportedStatementId[] {
  const ids: ReportedStatementId[] = [];
  for (const id of ['ic', 'bs', 'cf'] as const) {
    if ((document.statements[id]?.rows.length ?? 0) > 0) ids.push(id);
  }
  return ids;
}

export function getStatementPivot(document: SecStatementsDocument, statementId: ReportedStatementId) {
  return document.statements[statementId] ?? { years: [], rows: [] };
}

export function formatReportedMoney(value: number | null, unit = 'usd'): string {
  if (value === null) return '-';
  const abs = Math.abs(value);
  const prefix = unit.toLowerCase() === 'usd' ? '$' : '';
  if (abs >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`;
  return `${prefix}${value.toFixed(0)}`;
}

export function formatSecSourceLine(document: SecStatementsDocument): string {
  const latest = document.recentFilings[0];
  const filing = latest
    ? `${latest.form} filed ${latest.filingDate.slice(0, 10)} · FY ended ${latest.reportDate.slice(0, 10)}`
    : 'annual metrics from SEC XBRL company facts';
  const cik = document.cik ? ` · CIK ${document.cik}` : '';
  return `${filing}${cik}`;
}
