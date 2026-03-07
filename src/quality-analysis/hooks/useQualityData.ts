import { useState, useEffect, useRef } from 'react';
import { safeSetItem } from '../utils/storage';
import type { QualityData } from '../types';
import { proxyFetch } from '../../utils/proxyFetch';

const FMP_URL = 'https://financialmodelingprep.com/stable';
const FINNHUB_URL = 'https://finnhub.io/api/v1';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface UseQualityDataResult {
  data: QualityData | null;
  loading: boolean;
  error: string;
}

export function useQualityData(symbol: string): UseQualityDataResult {
  const [data, setData] = useState<QualityData | null>(null);
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
        const cacheKey = `fmp_${symbol}_dcf_v1`;
        const cached = localStorage.getItem(cacheKey);
        let fetchedData: QualityData | undefined;

        if (cached) {
          try {
            const { timestamp, data: cachedData } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL_MS && cachedData?.incomeStatements?.length) {
              fetchedData = cachedData;
            }
          } catch { localStorage.removeItem(cacheKey); }
        }

        if (!fetchedData) {
          const [resIc, resBs, resCf, resProfile, resMetric] = await Promise.all([
            proxyFetch(`${FMP_URL}/income-statement?symbol=${symbol}&period=annual&limit=5`, { signal: controller.signal }),
            proxyFetch(`${FMP_URL}/balance-sheet-statement?symbol=${symbol}&period=annual&limit=5`, { signal: controller.signal }),
            proxyFetch(`${FMP_URL}/cash-flow-statement?symbol=${symbol}&period=annual&limit=5`, { signal: controller.signal }),
            proxyFetch(`${FINNHUB_URL}/stock/profile2?symbol=${symbol}`, { signal: controller.signal }),
            proxyFetch(`${FINNHUB_URL}/stock/metric?symbol=${symbol}&metric=all`, { signal: controller.signal }),
          ]);

          if (!resIc.ok || !resBs.ok || !resCf.ok) {
            const failedRes = [resIc, resBs, resCf].find(r => !r.ok);
            throw new Error(`FMP request failed (${failedRes?.status ?? 'unknown'})`);
          }

          const [icData, bsData, cfData, profData, metricData] = await Promise.all([
            resIc.json(), resBs.json(), resCf.json(),
            resProfile.ok ? resProfile.json() : null,
            resMetric.ok ? resMetric.json() : null,
          ]);

          if (!Array.isArray(icData) || icData.length === 0) {
            throw new Error('No income statement data found for this ticker.');
          }

          fetchedData = {
            incomeStatements: icData,
            balanceSheets: Array.isArray(bsData) ? bsData : [],
            cashFlows: Array.isArray(cfData) ? cfData : [],
            profile: profData || {},
            metrics: metricData?.metric || metricData || {},
          };

          safeSetItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: fetchedData }));
        }

        if (requestId !== requestIdRef.current) return;
        setData(fetchedData);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (requestId !== requestIdRef.current) return;

        const cacheKey = `fmp_${symbol}_dcf_v1`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data: cachedData } = JSON.parse(cached);
            if (cachedData?.incomeStatements?.length) {
              setData(cachedData);
              setError('Live data fetch failed, showing cached financials.');
              return;
            }
          } catch { localStorage.removeItem(cacheKey); }
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
