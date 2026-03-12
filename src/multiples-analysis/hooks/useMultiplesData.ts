import { useState, useEffect, useRef } from 'react';
import { safeSetItem } from '../utils/storage';
import type { MultiplesData } from '../types';
import { proxyFetch } from '../../utils/proxyFetch';

const FMP_URL = 'https://financialmodelingprep.com/stable';
const FINNHUB_URL = 'https://finnhub.io/api/v1';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface UseMultiplesDataResult {
  data: MultiplesData | null;
  loading: boolean;
  error: string;
}

export function useMultiplesData(symbol: string): UseMultiplesDataResult {
  const [data, setData] = useState<MultiplesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setError('');
      return;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const fmpCacheKey = `fmp_${symbol}_dcf_v1`;
        const candleCacheKey = `multiples_${symbol}_candle_v1`;

        let fmpData: Omit<MultiplesData, 'candles'> | undefined;
        let seriesData: MultiplesData['series'] = null;

        // Try shared FMP cache first
        const cached = localStorage.getItem(fmpCacheKey);
        if (cached) {
          try {
            const { timestamp, data: cachedData } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL_MS && cachedData?.incomeStatements?.length) {
              fmpData = cachedData;
            }
          } catch { localStorage.removeItem(fmpCacheKey); }
        }

        // If not cached, fetch from FMP + Finnhub
        if (!fmpData) {
          // Always fetch Finnhub data (profile + metrics) regardless of FMP
          const [resProfile, resMetric] = await Promise.all([
            proxyFetch(`${FINNHUB_URL}/stock/profile2?symbol=${symbol}`, { signal: controller.signal }),
            proxyFetch(`${FINNHUB_URL}/stock/metric?symbol=${symbol}&metric=all`, { signal: controller.signal }),
          ]);
          const profData = resProfile.ok ? await resProfile.json() : null;
          const metricData = resMetric.ok ? await resMetric.json() : null;
          seriesData = metricData?.series || null;

          // Try FMP financial statements
          let fmpSuccess = false;
          try {
            const [resIc, resBs, resCf] = await Promise.all([
              proxyFetch(`${FMP_URL}/income-statement?symbol=${symbol}&period=annual&limit=6`, { signal: controller.signal }),
              proxyFetch(`${FMP_URL}/balance-sheet-statement?symbol=${symbol}&period=annual&limit=6`, { signal: controller.signal }),
              proxyFetch(`${FMP_URL}/cash-flow-statement?symbol=${symbol}&period=annual&limit=6`, { signal: controller.signal }),
            ]);

            if (resIc.ok && resBs.ok && resCf.ok) {
              const [icData, bsData, cfData] = await Promise.all([
                resIc.json(), resBs.json(), resCf.json(),
              ]);

              if (Array.isArray(icData) && icData.length > 0) {
                fmpData = {
                  incomeStatements: icData,
                  balanceSheets: Array.isArray(bsData) ? bsData : [],
                  cashFlows: Array.isArray(cfData) ? cfData : [],
                  profile: profData || {},
                  metrics: metricData?.metric || metricData || {},
                  series: seriesData,
                };
                safeSetItem(fmpCacheKey, JSON.stringify({ timestamp: Date.now(), data: fmpData }));
                fmpSuccess = true;
              }
            }
          } catch {
            // FMP failed — will fall back to Finnhub-only below
          }

          // Finnhub-only fallback: use series data for multiples
          if (!fmpSuccess) {
            fmpData = {
              incomeStatements: [],
              balanceSheets: [],
              cashFlows: [],
              profile: profData || {},
              metrics: metricData?.metric || metricData || {},
              series: seriesData,
            };
          }
        }

        // Ensure profile/metrics are present; fetch from Finnhub if missing
        if (!fmpData.profile?.name || !fmpData.profile?.marketCapitalization) {
          const [resProfile, resMetric] = await Promise.all([
            proxyFetch(`${FINNHUB_URL}/stock/profile2?symbol=${symbol}`, { signal: controller.signal }),
            proxyFetch(`${FINNHUB_URL}/stock/metric?symbol=${symbol}&metric=all`, { signal: controller.signal }),
          ]);
          const profData = resProfile.ok ? await resProfile.json() : null;
          const metricData = resMetric.ok ? await resMetric.json() : null;
          if (profData?.name) fmpData.profile = profData;
          if (metricData?.metric) fmpData.metrics = metricData.metric;
          if (metricData?.series) fmpData.series = metricData.series;
        }

        // Fetch historical candle prices from Finnhub
        let candles: MultiplesData['candles'] = null;
        const candleCached = localStorage.getItem(candleCacheKey);
        if (candleCached) {
          try {
            const { timestamp, data: cachedCandles } = JSON.parse(candleCached);
            if (Date.now() - timestamp < CACHE_TTL_MS && cachedCandles?.s === 'ok') {
              candles = cachedCandles;
            }
          } catch { localStorage.removeItem(candleCacheKey); }
        }

        if (!candles) {
          const now = Math.floor(Date.now() / 1000);
          const sixYearsAgo = now - 6 * 365 * 24 * 60 * 60;
          const resCandle = await proxyFetch(
            `${FINNHUB_URL}/stock/candle?symbol=${symbol}&resolution=D&from=${sixYearsAgo}&to=${now}`,
            { signal: controller.signal },
          );
          if (resCandle.ok) {
            const candleData = await resCandle.json();
            if (candleData?.s === 'ok') {
              candles = candleData;
              safeSetItem(candleCacheKey, JSON.stringify({ timestamp: Date.now(), data: candleData }));
            }
          }
        }

        if (requestId !== requestIdRef.current) return;
        setData({ ...fmpData, series: fmpData.series ?? seriesData, candles });
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (requestId !== requestIdRef.current) return;

        // On error, still try to use expired cache as fallback
        const fmpCacheKey = `fmp_${symbol}_dcf_v1`;
        const cached = localStorage.getItem(fmpCacheKey);
        if (cached) {
          try {
            const { data: cachedData } = JSON.parse(cached);
            if (cachedData?.incomeStatements?.length) {
              setData({ ...cachedData, series: cachedData.series ?? null, candles: null });
              setError('Live data fetch failed, showing cached financials.');
              return;
            }
          } catch { localStorage.removeItem(fmpCacheKey); }
        }
        setError(err.message || 'Failed to fetch financial data.');
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [symbol]);

  return { data, loading, error };
}
