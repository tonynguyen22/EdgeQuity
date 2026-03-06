/* ── Financials — Pure Calculation Functions ──────────────────────────── */

import type { StatementLineItem, GrowthData, TrendPoint } from './types';

/**
 * Compute year-over-year growth rates for a line item across periods.
 */
export function computeGrowth(item: StatementLineItem, periods: string[]): Record<string, number | null> {
    const growths: Record<string, number | null> = {};
    for (let i = 1; i < periods.length; i++) {
        const curr = item.values[periods[i]];
        const prev = item.values[periods[i - 1]];
        if (curr != null && prev != null && prev !== 0) {
            growths[periods[i]] = (curr - prev) / Math.abs(prev);
        } else {
            growths[periods[i]] = null;
        }
    }
    return growths;
}

/**
 * Compute growth data for all line items.
 */
export function computeAllGrowths(items: StatementLineItem[], periods: string[]): GrowthData[] {
    return items.map(item => ({
        label: item.label,
        growths: computeGrowth(item, periods),
    }));
}

/**
 * Build chart data from selected line items for trend visualization.
 */
export function buildTrendData(
    items: StatementLineItem[],
    periods: string[],
    selectedLabels: string[],
): TrendPoint[] {
    return periods.map(period => {
        const point: TrendPoint = { period };
        for (const label of selectedLabels) {
            const item = items.find(i => i.label === label);
            point[label] = item?.values[period] ?? null;
        }
        return point;
    });
}

/**
 * Compute a simple margin: numerator / denominator for each period.
 */
export function computeMargins(
    numerator: StatementLineItem | undefined,
    denominator: StatementLineItem | undefined,
    periods: string[],
): Record<string, number | null> {
    const margins: Record<string, number | null> = {};
    if (!numerator || !denominator) return margins;
    for (const p of periods) {
        const num = numerator.values[p];
        const den = denominator.values[p];
        if (num != null && den != null && den !== 0) {
            margins[p] = num / den;
        } else {
            margins[p] = null;
        }
    }
    return margins;
}

/**
 * Find a line item by label (case-insensitive partial match).
 */
export function findLineItem(items: StatementLineItem[], ...keywords: string[]): StatementLineItem | undefined {
    for (const kw of keywords) {
        const lower = kw.toLowerCase();
        const found = items.find(i => i.label.toLowerCase().includes(lower));
        if (found) return found;
    }
    return undefined;
}

/**
 * Compute key income statement metrics for the chart section.
 */
export function computeIncomeMetrics(income: StatementLineItem[], periods: string[]): TrendPoint[] {
    const revenue = findLineItem(income, 'revenue', 'net sales', 'total revenue');
    const grossProfit = findLineItem(income, 'gross profit');
    const operatingIncome = findLineItem(income, 'operating income', 'income from operations');
    const netIncome = findLineItem(income, 'net income');

    return periods.map(p => ({
        period: p,
        Revenue: revenue?.values[p] ?? null,
        'Gross Profit': grossProfit?.values[p] ?? null,
        'Operating Income': operatingIncome?.values[p] ?? null,
        'Net Income': netIncome?.values[p] ?? null,
    }));
}

/**
 * Compute margin trends for the chart section.
 */
export function computeMarginTrends(income: StatementLineItem[], periods: string[]): TrendPoint[] {
    const revenue = findLineItem(income, 'revenue', 'net sales', 'total revenue');
    const grossProfit = findLineItem(income, 'gross profit');
    const operatingIncome = findLineItem(income, 'operating income', 'income from operations');
    const netIncome = findLineItem(income, 'net income');

    const grossMargins = computeMargins(grossProfit, revenue, periods);
    const opMargins = computeMargins(operatingIncome, revenue, periods);
    const netMargins = computeMargins(netIncome, revenue, periods);

    return periods.map(p => ({
        period: p,
        'Gross Margin': grossMargins[p] != null ? +(grossMargins[p]! * 100).toFixed(1) : null,
        'Operating Margin': opMargins[p] != null ? +(opMargins[p]! * 100).toFixed(1) : null,
        'Net Margin': netMargins[p] != null ? +(netMargins[p]! * 100).toFixed(1) : null,
    }));
}
