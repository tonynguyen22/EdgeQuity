import { useState, useEffect } from 'react';
import { safeSetItem } from '../utils/storage';
import type { FinancialData, AnalystTarget } from '../types';

const API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

interface UseDCFDataResult {
  data: FinancialData | null;
  loading: boolean;
  error: string;
  analystTarget: AnalystTarget | null;
  refetch: () => void;
  reset: () => void;
}

export function useDCFData(symbol: string): UseDCFDataResult {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analystTarget, setAnalystTarget] = useState<AnalystTarget | null>(null);

  const fetchData = async (sym: string) => {
    setLoading(true);
    setError('');
    try {
      const cacheKey = `finnhub_${sym}_financials_v2`;
      const cached = localStorage.getItem(cacheKey);
      let fetchedData: FinancialData | undefined;

      if (cached) {
        try {
          const { timestamp, data: cachedData } = JSON.parse(cached);
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            fetchedData = cachedData;
          }
        } catch { localStorage.removeItem(cacheKey); }
      }

      if (!fetchedData) {
        const [resFin, resProf, resMetric] = await Promise.all([
          fetch(`${BASE_URL}/stock/financials-reported?symbol=${sym}&freq=annual&token=${API_KEY}`),
          fetch(`${BASE_URL}/stock/profile2?symbol=${sym}&token=${API_KEY}`),
          fetch(`${BASE_URL}/stock/metric?symbol=${sym}&metric=all&token=${API_KEY}`),
        ]);
        const [finData, profData, metricData] = await Promise.all([
          resFin.json(), resProf.json(), resMetric.json(),
        ]);

        if (finData.error || profData.error || metricData.error) {
          throw new Error(finData.error || profData.error || metricData.error);
        }

        const financials = (finData.data || []).slice(0, 6);

        if (financials.length === 0) {
          throw new Error('No financial data found. Only US-listed stocks with SEC filings (NYSE / NASDAQ) are supported.');
        }

        fetchedData = {
          financials,
          profile: profData,
          metrics: metricData.metric,
        };

        safeSetItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: fetchedData,
        }));
      }

      if (!fetchedData.financials || fetchedData.financials.length === 0) {
        throw new Error('No financial data found for this ticker.');
      }

      setData(fetchedData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data from Finnhub API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchData(symbol);
      setAnalystTarget(null);
      fetch(`${BASE_URL}/stock/price-target?symbol=${symbol}&token=${API_KEY}`)
        .then(r => r.json())
        .then(d => {
          if (d?.targetMean || d?.targetMedian) {
            setAnalystTarget({ mean: d.targetMean ?? d.targetMedian ?? 0, high: d.targetHigh ?? 0, low: d.targetLow ?? 0 });
          }
        })
        .catch(() => { });
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
