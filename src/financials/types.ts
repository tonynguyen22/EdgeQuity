/* ── Financials Module Types ──────────────────────────────────────────── */

export type StatementType = 'income' | 'balance' | 'cashflow';

/** A single line item in a financial statement */
export interface StatementLineItem {
    label: string;
    values: Record<string, number | null>;
}

/** Full financial data response from the Python backend */
export interface FinancialsResponse {
    ticker: string;
    company_name: string;
    cik: string;
    income_statement: StatementLineItem[];
    balance_sheet: StatementLineItem[];
    cash_flow: StatementLineItem[];
    periods: string[];
}

/** Derived growth rates for a line item across periods */
export interface GrowthData {
    label: string;
    growths: Record<string, number | null>;
}

/** Chart data point for trend visualization */
export interface TrendPoint {
    period: string;
    [key: string]: string | number | null;
}
