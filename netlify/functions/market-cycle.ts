// v2 — monthly + weekly only (daily via client-side proxy)
/**
 * market-cycle.ts — Netlify serverless function
 *
 * Fetches SPY candle data from Alpha Vantage (monthly + weekly only).
 * Daily data is fetched client-side via the existing proxy chain because
 * AV free tier limits daily outputsize=full to premium.
 *
 * Module-level in-memory cache means ALL users share a single set of
 * API calls. Combined with HTTP Cache-Control headers for CDN caching.
 *
 * GET /.netlify/functions/market-cycle
 * Returns: { monthly: Candle[], weekly: Candle[] }
 */

interface Candle {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface CacheEntry {
    ts: number;
    candles: Candle[];
}

// Module-level cache — persists across warm invocations
const cache: Record<string, CacheEntry> = {};

const WEEKLY_TTL = 24 * 60 * 60 * 1000;       // 24 hours
const MONTHLY_TTL = 7 * 24 * 60 * 60 * 1000;  // 7 days
const AV_DELAY_MS = 1500;
const AV_BASE = 'https://www.alphavantage.co/query';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function respond(statusCode: number, body: any) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600, s-maxage=14400',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(body),
    };
}

// ── Normalizers ──────────────────────────────────────────────────────────────

function normalizeWeekly(data: any): Candle[] {
    const ts = data?.['Weekly Time Series'];
    if (!ts) return [];
    return Object.entries(ts).map(([date, v]: [string, any]) => ({
        date,
        open: parseFloat(v['1. open']),
        high: parseFloat(v['2. high']),
        low: parseFloat(v['3. low']),
        close: parseFloat(v['4. close']),
        volume: parseInt(v['5. volume'], 10),
    })).sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeMonthly(data: any): Candle[] {
    const ts = data?.['Monthly Time Series'];
    if (!ts) return [];
    return Object.entries(ts).map(([date, v]: [string, any]) => ({
        date,
        open: parseFloat(v['1. open']),
        high: parseFloat(v['2. high']),
        low: parseFloat(v['3. low']),
        close: parseFloat(v['4. close']),
        volume: parseInt(v['5. volume'], 10),
    })).sort((a, b) => a.date.localeCompare(b.date));
}

// ── Fetch with cache ─────────────────────────────────────────────────────────

async function fetchCached(
    cacheKey: string,
    ttl: number,
    avFunction: string,
    normalizer: (d: any) => Candle[],
    slice: number,
    minCount: number,
    apiKey: string,
): Promise<Candle[]> {
    const entry = cache[cacheKey];
    if (entry && Date.now() - entry.ts < ttl && entry.candles.length >= minCount) {
        return entry.candles;
    }

    const url = `${AV_BASE}?function=${avFunction}&symbol=SPY&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${avFunction}: HTTP ${res.status}`);

    const json = await res.json();
    if (json?.['Note'] || json?.['Information']) {
        throw new Error(`${avFunction}: rate limit — ${json['Note'] || json['Information']}`);
    }

    let candles = normalizer(json);
    if (candles.length < minCount) {
        throw new Error(`${avFunction}: only ${candles.length} candles (need ${minCount}+)`);
    }

    if (slice > 0) candles = candles.slice(-slice);

    cache[cacheKey] = { ts: Date.now(), candles };
    return candles;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export const handler = async () => {
    const apiKey = process.env.ALPHAVANTAGE_API_KEY;
    if (!apiKey) return respond(500, { error: 'ALPHAVANTAGE_API_KEY not configured' });

    try {
        // Monthly first (longest cache = usually cached)
        const monthlyWasCached = !!cache['monthly']?.candles?.length &&
            Date.now() - (cache['monthly']?.ts || 0) < MONTHLY_TTL;

        const monthly = await fetchCached(
            'monthly', MONTHLY_TTL, 'TIME_SERIES_MONTHLY',
            normalizeMonthly, 0, 200, apiKey,
        );

        // Delay between requests if monthly was freshly fetched
        const weeklyWasCached = !!cache['weekly']?.candles?.length &&
            Date.now() - (cache['weekly']?.ts || 0) < WEEKLY_TTL;

        if (!monthlyWasCached && !weeklyWasCached) {
            await sleep(AV_DELAY_MS);
        }

        const weekly = await fetchCached(
            'weekly', WEEKLY_TTL, 'TIME_SERIES_WEEKLY',
            normalizeWeekly, 260, 200, apiKey,
        );

        return respond(200, { monthly, weekly });
    } catch (err: any) {
        return respond(502, { error: err.message || 'Failed to fetch market data' });
    }
};
