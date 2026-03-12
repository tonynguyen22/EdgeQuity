import { useState, useEffect, useCallback } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';

const FINNHUB_URL = 'https://finnhub.io/api/v1';
const CACHE_KEY = 'vw_market_ticker_v3';
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour

export interface MarketIndex {
  name: string;
  symbol: string;
  value: string;
  change: string;
  up: boolean;
  spark: number[];
}

/* ── Default fallback data (big-cap stocks) ─────────────────────────── */
const FALLBACK: MarketIndex[] = [
  { name: 'AAPL', symbol: 'AAPL', value: '—', change: '—', up: true, spark: [22, 20, 24, 21, 26, 25, 28] },
  { name: 'MSFT', symbol: 'MSFT', value: '—', change: '—', up: true, spark: [18, 22, 20, 26, 24, 29, 31] },
  { name: 'GOOGL', symbol: 'GOOGL', value: '—', change: '—', up: true, spark: [30, 28, 32, 27, 29, 26, 25] },
  { name: 'AMZN', symbol: 'AMZN', value: '—', change: '—', up: true, spark: [14, 16, 13, 17, 15, 18, 19] },
  { name: 'NVDA', symbol: 'NVDA', value: '—', change: '—', up: true, spark: [24, 22, 26, 20, 23, 28, 30] },
  { name: 'META', symbol: 'META', value: '—', change: '—', up: true, spark: [20, 18, 22, 24, 21, 26, 28] },
  { name: 'TSLA', symbol: 'TSLA', value: '—', change: '—', up: false, spark: [28, 25, 30, 22, 26, 20, 18] },
  { name: 'BRK.B', symbol: 'BRK.B', value: '—', change: '—', up: true, spark: [16, 18, 17, 20, 19, 22, 24] },
];

/* ── Helpers ────────────────────────────────────────────────────────── */
const safeJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  if (!text || text.trim().startsWith('<')) return null;
  try { return JSON.parse(text); } catch { return null; }
};

function fmtPrice(val: number): string {
  if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return val.toFixed(2);
}

/* ── Hook ───────────────────────────────────────────────────────────── */
export function useMarketData() {
  const [indices, setIndices] = useState<MarketIndex[]>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  const fetchAll = useCallback(async () => {
    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, d } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL && Array.isArray(d) && d.length > 0) {
          setIndices(d);
          setLoaded(true);
          return;
        }
      }
    } catch { /* ignore bad cache */ }

    // Fetch quotes for each symbol (candle endpoint is premium-only)
    const symbols = FALLBACK.map(f => f.symbol);

    try {
      const results = await Promise.all(
        symbols.map(async (sym) => {
          try {
            const quoteRes = await proxyFetch(`${FINNHUB_URL}/quote?symbol=${sym}`);
            const quote = await safeJson(quoteRes);

            if (!quote || quote.c === 0 || quote.c === undefined) return null;

            const spark = FALLBACK.find(f => f.symbol === sym)?.spark || [0];
            const up = (quote.d ?? 0) >= 0;
            const changePct = quote.dp != null ? `${up ? '+' : ''}${quote.dp.toFixed(2)}%` : '—';

            return {
              name: FALLBACK.find(f => f.symbol === sym)!.name,
              symbol: sym,
              value: fmtPrice(quote.c),
              change: changePct,
              up,
              spark,
            } as MarketIndex;
          } catch {
            return null;
          }
        })
      );

      const valid = results.filter((r): r is MarketIndex => r !== null);
      if (valid.length > 0) {
        // Merge: keep fallback order, replace with fetched data where available
        const merged = FALLBACK.map(fb => valid.find(v => v.symbol === fb.symbol) || fb);
        setIndices(merged);
        setLoaded(true);

        // Cache
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), d: merged })); } catch { /* quota */ }
      }
    } catch {
      // Keep fallback on full failure
    }
  }, []);

  useEffect(() => {
    fetchAll();

    // Re-fetch every 1 hour
    const interval = setInterval(fetchAll, CACHE_TTL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { indices, loaded };
}
