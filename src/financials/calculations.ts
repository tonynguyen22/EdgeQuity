/* ── Financials — Pure Calculation Functions ──────────────────────────── */

import type { StatementLineItem, GrowthData } from './types';

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
