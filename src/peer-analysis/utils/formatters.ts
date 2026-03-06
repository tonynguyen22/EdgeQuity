/* ── Peer Analysis — Number Formatters ────────────────────────────────── */

export const formatCurrency = (val: number): string => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    if (absVal >= 1e9) return `${isNegative ? '-' : ''}$${(absVal / 1e9).toFixed(2)}B`;
    if (absVal >= 1e6) return `${isNegative ? '-' : ''}$${(absVal / 1e6).toFixed(2)}M`;
    return `${isNegative ? '-' : ''}$${absVal.toFixed(2)}`;
};

export const formatPct = (val: number): string => `${(val * 100).toFixed(2)}%`;

export const fmtX = (val: number | null | undefined): string =>
    val != null && isFinite(val) && val > 0 ? `${val.toFixed(2)}x` : '—';
