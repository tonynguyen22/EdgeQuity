/* ── Financials — Number / Currency Formatters ────────────────────────── */

/**
 * Format a number as currency with appropriate scale suffix.
 * @param value  Raw number (e.g. 394_328_000_000)
 * @param unit   'B' for billions, 'M' for millions
 */
export function formatStatValue(value: number | null | undefined, unit: 'M' | 'B' = 'B'): string {
    if (value == null) return '—';
    const divisor = unit === 'B' ? 1e9 : 1e6;
    const scaled = value / divisor;
    if (Math.abs(scaled) >= 100) return `$${scaled.toFixed(0)}${unit}`;
    if (Math.abs(scaled) >= 10) return `$${scaled.toFixed(1)}${unit}`;
    return `$${scaled.toFixed(2)}${unit}`;
}

/**
 * Format a raw number with commas (no currency prefix).
 */
export function formatNumber(value: number | null | undefined): string {
    if (value == null) return '—';
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Format a decimal as percentage (e.g. 0.2345 → "23.5%").
 */
export function formatPct(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format a growth rate (e.g. 0.15 → "+15.0%", -0.03 → "-3.0%").
 */
export function formatGrowth(value: number | null | undefined): string {
    if (value == null) return '—';
    const pct = (value * 100).toFixed(1);
    return value >= 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * Compact format for table cells — shows value in M or B depending on magnitude.
 */
export function formatCompact(value: number | null | undefined): string {
    if (value == null) return '—';
    const abs = Math.abs(value);
    if (abs >= 1e9) {
        const v = value / 1e9;
        return `${v >= 0 ? '' : '-'}$${Math.abs(v).toFixed(1)}B`;
    }
    if (abs >= 1e6) {
        const v = value / 1e6;
        return `${v >= 0 ? '' : '-'}$${Math.abs(v).toFixed(0)}M`;
    }
    if (abs >= 1e3) {
        const v = value / 1e3;
        return `${v >= 0 ? '' : '-'}$${Math.abs(v).toFixed(0)}K`;
    }
    return `$${value.toFixed(2)}`;
}
