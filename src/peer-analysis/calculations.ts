/* ── Peer Analysis — Pure Calculations ────────────────────────────────── */

import type {
    PeerData, StatsResult, AllStats, ImpliedPrice,
    TargetPercentiles, RadarScorePoint, RankingData, BubblePoint,
} from './types';

/* ── Stats ─────────────────────────────────────────────────────────────── */

export function calcStats(
    data: PeerData[],
    selectedPeers: Record<string, boolean>,
    key: keyof PeerData,
): StatsResult {
    const values = data
        .slice(1)
        .filter(d => selectedPeers[d.symbol])
        .map(d => d[key] as number)
        .filter(v => v != null && !isNaN(v) && v > 0)
        .sort((a, b) => a - b);

    if (values.length === 0) return { mean: 0, median: 0, p25: 0, p75: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const getPercentile = (p: number) => {
        const idx = (values.length - 1) * p;
        const lower = Math.floor(idx);
        const upper = Math.ceil(idx);
        if (upper >= values.length) return values[lower];
        return values[lower] * (1 - (idx - lower)) + values[upper] * (idx - lower);
    };

    return { mean, median: getPercentile(0.5), p25: getPercentile(0.25), p75: getPercentile(0.75) };
}

export function computeAllStats(
    data: PeerData[],
    selectedPeers: Record<string, boolean>,
): AllStats {
    return {
        revGrowth: calcStats(data, selectedPeers, 'revGrowth'),
        ebitda: calcStats(data, selectedPeers, 'ebitda'),
        ebitdaMargin: calcStats(data, selectedPeers, 'ebitdaMargin'),
        netIncome: calcStats(data, selectedPeers, 'netIncome'),
        niMargin: calcStats(data, selectedPeers, 'niMargin'),
        price: calcStats(data, selectedPeers, 'price'),
        marketCap: calcStats(data, selectedPeers, 'marketCap'),
        ev: calcStats(data, selectedPeers, 'ev'),
        evToRev: calcStats(data, selectedPeers, 'evToRev'),
        evToEbitda: calcStats(data, selectedPeers, 'evToEbitda'),
        pToSales: calcStats(data, selectedPeers, 'pToSales'),
        pToE: calcStats(data, selectedPeers, 'pToE'),
        pToBook: calcStats(data, selectedPeers, 'pToBook'),
        pToFCF: calcStats(data, selectedPeers, 'pToFCF'),
    };
}

/* ── Heatmap color ─────────────────────────────────────────────────────── */

export function getHeatmapColor(val: number, key: string, data: PeerData[]): string {
    const values = data.map(d => (d as any)[key]).filter((v: any) => v != null && !isNaN(v));
    if (values.length === 0) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) return '';
    return `rgba(16, 185, 129, ${((val - min) / (max - min)) * 0.4})`;
}

/* ── Implied prices ────────────────────────────────────────────────────── */

export function computeImpliedPrices(data: PeerData[], stats: AllStats): ImpliedPrice[] | null {
    if (data.length === 0) return null;
    const t = data[0];
    if (!t || t.sharesOut <= 0) return null;

    const evBridge = (impliedEv: number) =>
        t.sharesOut > 0 ? (impliedEv + t.totalCash - t.totalDebt) / t.sharesOut : null;

    return [
        { label: 'EV / Revenue', price: stats.evToRev.median > 0 && t.rev > 0 ? evBridge(stats.evToRev.median * t.rev) : null },
        { label: 'EV / EBITDA', price: stats.evToEbitda.median > 0 && t.ebitda > 0 ? evBridge(stats.evToEbitda.median * t.ebitda) : null },
        { label: 'P / Sales', price: stats.pToSales.median > 0 && t.rev > 0 ? stats.pToSales.median * (t.rev / t.sharesOut) : null },
        { label: 'P / Earnings', price: stats.pToE.median > 0 && t.netIncome > 0 ? stats.pToE.median * (t.netIncome / t.sharesOut) : null },
        { label: 'P / Book', price: stats.pToBook.median > 0 && t.totalEquity > 0 ? stats.pToBook.median * (t.totalEquity / t.sharesOut) : null },
        { label: 'P / FCF', price: stats.pToFCF.median > 0 && t.fcf > 0 ? stats.pToFCF.median * (t.fcf / t.sharesOut) : null },
    ].filter(r => r.price !== null && (r.price as number) > 0);
}

/* ── Target percentiles ────────────────────────────────────────────────── */

export function computeTargetPercentiles(data: PeerData[]): TargetPercentiles | null {
    if (data.length < 2) return null;

    const getPercentile = (key: string, higherIsBetter: boolean) => {
        const vals = data.map(d => (d as any)[key]).filter((v: any) => v != null && isFinite(v) && !isNaN(v));
        if (vals.length === 0 || (data[0] as any)[key] == null) return null;
        const tVal = (data[0] as any)[key];
        if (higherIsBetter) return Math.round(vals.filter((v: number) => v < tVal).length / vals.length * 100);
        return Math.round(vals.filter((v: number) => v > tVal).length / vals.length * 100);
    };

    return {
        revGrowth: getPercentile('revGrowth', true),
        ebitdaMargin: getPercentile('ebitdaMargin', true),
        evToRev: getPercentile('evToRev', false),
        evToEbitda: getPercentile('evToEbitda', false),
        pToSales: getPercentile('pToSales', false),
        pToE: getPercentile('pToE', false),
        pToBook: getPercentile('pToBook', false),
        pToFCF: getPercentile('pToFCF', false),
    };
}

/* ── Composite score ───────────────────────────────────────────────────── */

export function computeCompositeScore(percentiles: TargetPercentiles | null): number | null {
    if (!percentiles) return null;
    const vals = [
        percentiles.revGrowth, percentiles.ebitdaMargin,
        percentiles.evToRev, percentiles.evToEbitda,
        percentiles.pToSales, percentiles.pToE,
        percentiles.pToBook, percentiles.pToFCF,
    ].filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/* ── Radar scores ──────────────────────────────────────────────────────── */

export function computeRadarScores(
    percentiles: TargetPercentiles | null,
    data: PeerData[],
    stats: AllStats,
): RadarScorePoint[] | null {
    if (!percentiles || data.length < 2) return null;

    const getMedianPct = (key: string, higherIsBetter: boolean) => {
        const vals = data.map(d => (d as any)[key]).filter((v: any) => v != null && isFinite(v) && !isNaN(v));
        if (vals.length === 0) return 50;
        const medVal = (stats as any)[key]?.median ?? 0;
        if (higherIsBetter) return Math.round(vals.filter((v: number) => v < medVal).length / vals.length * 100);
        return Math.round(vals.filter((v: number) => v > medVal).length / vals.length * 100);
    };

    return [
        { subject: 'Rev Growth', target: percentiles.revGrowth ?? 50, median: getMedianPct('revGrowth', true) },
        { subject: 'EBITDA Margin', target: percentiles.ebitdaMargin ?? 50, median: getMedianPct('ebitdaMargin', true) },
        { subject: 'EV/EBITDA', target: percentiles.evToEbitda ?? 50, median: getMedianPct('evToEbitda', false) },
        { subject: 'P/E', target: percentiles.pToE ?? 50, median: getMedianPct('pToE', false) },
        { subject: 'P/Book', target: percentiles.pToBook ?? 50, median: getMedianPct('pToBook', false) },
        { subject: 'P/FCF', target: percentiles.pToFCF ?? 50, median: getMedianPct('pToFCF', false) },
    ];
}

/* ── Ranking data ──────────────────────────────────────────────────────── */

export function computeRankingData(data: PeerData[]): RankingData | null {
    if (data.length === 0) return null;

    const makeRanked = (key: keyof PeerData, ascending: boolean) =>
        [...data]
            .filter(d => (d[key] as number) != null && (d[key] as number) > 0)
            .sort((a, b) => ascending ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number))
            .map(d => ({ symbol: d.symbol, value: +(d[key] as number).toFixed(2), isTarget: d.symbol === data[0]?.symbol }));

    return {
        evToEbitda: makeRanked('evToEbitda', true),
        pToE: makeRanked('pToE', true),
        evToRev: makeRanked('evToRev', true),
        revGrowth: makeRanked('revGrowth', false),
    };
}

/* ── Bubble chart data ─────────────────────────────────────────────────── */

export function computeBubbleData(data: PeerData[]): BubblePoint[] {
    return data
        .map((d, i) => ({
            x: d.evToEbitda > 0 ? +d.evToEbitda.toFixed(1) : null,
            y: +(d.revGrowth * 100).toFixed(1),
            z: d.marketCap,
            symbol: d.symbol,
            isTarget: i === 0,
        }))
        .filter(d => d.x !== null);
}

/* ── Multi-line EV/EBITDA history ──────────────────────────────────────── */

export function computeMultiHistData(data: PeerData[]): Record<string, any>[] {
    if (data.length === 0) return [];
    const years = Array.from(
        new Set(data.flatMap(d => (d.histEvEbitda ?? []).map(h => h.year))),
    )
        .sort()
        .slice(-3);

    return years.map(year => {
        const row: Record<string, any> = { year };
        data.forEach(d => {
            const h = (d.histEvEbitda ?? []).find(h => h.year === year);
            row[d.symbol] = h?.evEbitda ?? null;
        });
        return row;
    });
}

/* ── Sorted display data ──────────────────────────────────────────────── */

export function computeDisplayData(
    data: PeerData[],
    sortKey: string | null,
    sortDir: 'asc' | 'desc',
): PeerData[] {
    if (!sortKey || data.length === 0) return data;
    const [target, ...peers] = data;
    const sorted = [...peers].sort((a, b) => {
        const av = (a as any)[sortKey] ?? 0;
        const bv = (b as any)[sortKey] ?? 0;
        return sortDir === 'asc' ? av - bv : bv - av;
    });
    return [target, ...sorted];
}

/* ── Ordinal helper ────────────────────────────────────────────────────── */

export function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
