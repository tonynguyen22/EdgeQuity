import { useState, useEffect, useRef } from 'react';
import { safeSetItem } from '../utils/storage';
import type { FinancialData, AnalystTarget } from '../types';

const FMP_KEY = process.env.FMP_API_KEY;
const FMP_URL = 'https://financialmodelingprep.com/stable';
const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

interface UseDCFDataResult {
  data: FinancialData | null;
  loading: boolean;
  error: string;
  analystTarget: AnalystTarget | null;
  refetch: () => void;
  reset: () => void;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function useDCFData(symbol: string): UseDCFDataResult {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analystTarget, setAnalystTarget] = useState<AnalystTarget | null>(null);
  const requestIdRef = useRef(0);
  const analystRequestIdRef = useRef(0);

  const fetchData = async (sym: string, signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const cacheKey = `fmp_${sym}_dcf_v1`;
      const cached = localStorage.getItem(cacheKey);
      let fetchedData: FinancialData | undefined;

      if (cached) {
        try {
          const { timestamp, data: cachedData } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL_MS) {
            fetchedData = cachedData;
          }
        } catch { localStorage.removeItem(cacheKey); }
      }

      if (!fetchedData) {
        const [resIc, resBs, resCf, resProfile, resMetric] = await Promise.all([
          fetch(`${FMP_URL}/income-statement?symbol=${sym}&period=annual&limit=5&apikey=${FMP_KEY}`, { signal }),
          fetch(`${FMP_URL}/balance-sheet-statement?symbol=${sym}&period=annual&limit=5&apikey=${FMP_KEY}`, { signal }),
          fetch(`${FMP_URL}/cash-flow-statement?symbol=${sym}&period=annual&limit=5&apikey=${FMP_KEY}`, { signal }),
          fetch(`${FINNHUB_URL}/stock/profile2?symbol=${sym}&token=${FINNHUB_KEY}`, { signal }),
          fetch(`${FINNHUB_URL}/stock/metric?symbol=${sym}&metric=all&token=${FINNHUB_KEY}`, { signal }),
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
          throw new Error('No income statement data found. This ticker may not have standard financial statements (e.g., ETFs).');
        }

        fetchedData = {
          incomeStatements: icData,
          balanceSheets: Array.isArray(bsData) ? bsData : [],
          cashFlows: Array.isArray(cfData) ? cfData : [],
          profile: profData || {},
          metrics: metricData?.metric || metricData || {},
        };

        safeSetItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: fetchedData,
        }));
      }

      if (!fetchedData.incomeStatements || fetchedData.incomeStatements.length === 0) {
        throw new Error('No financial data found for this ticker.');
      }

      if (requestId !== requestIdRef.current) return;
      setData(fetchedData);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const cacheKey = `fmp_${sym}_dcf_v1`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data: cachedData } = JSON.parse(cached);
          if (cachedData?.incomeStatements?.length) {
            if (requestId === requestIdRef.current) {
              setData(cachedData);
              setError('Live data fetch failed, showing cached financials.');
            }
            return;
          }
        } catch {
          localStorage.removeItem(cacheKey);
        }
      }
      setError(err.message || 'Failed to fetch financial data.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (symbol) {
      const controller = new AbortController();
      fetchData(symbol, controller.signal);
      setAnalystTarget(null);
      const analystRequestId = ++analystRequestIdRef.current;
      fetch(`${FINNHUB_URL}/stock/price-target?symbol=${symbol}&token=${FINNHUB_KEY}`, { signal: controller.signal })
        .then(r => r.json())
        .then(d => {
          if (analystRequestId !== analystRequestIdRef.current) return;
          if (d?.targetMean || d?.targetMedian) {
            setAnalystTarget({ mean: d.targetMean ?? d.targetMedian ?? 0, high: d.targetHigh ?? 0, low: d.targetLow ?? 0 });
          }
        })
        .catch(() => { });
      return () => controller.abort();
    }
  }, [symbol]);

  const reset = () => {
    setData(null);
    setError('');
    setAnalystTarget(null);
  };

  return {
    data,
    loading,
    error,
    analystTarget,
    refetch: () => symbol && fetchData(symbol),
    reset,
  };
}
