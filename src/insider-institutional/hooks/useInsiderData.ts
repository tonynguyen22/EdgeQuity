import { useState } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';
import { safeSetItem } from '../utils/storage';
import type { InsiderData } from '../types';

const BASE_URL = 'https://finnhub.io/api/v1';
const CACHE_TTL = 6 * 60 * 60 * 1000;

const safeJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  if (!text || text.trim().startsWith('<')) throw new Error('Finnhub returned an error page. This endpoint may not be available on the free plan or the ticker has no data.');
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) throw new Error(`Finnhub: ${parsed.error}`);
    return parsed;
  } catch (e: any) {
    if (e.message?.startsWith('Finnhub:')) throw e;
    throw new Error('Invalid response from API.');
  }
};

const getDateRange = () => {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
};

export function useInsiderData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<InsiderData | null>(null);

  const fetchData = async (symbol: string) => {
    setLoading(true);
    setError('');
    try {
      const cacheKey = `insider_${symbol}_v1`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, d } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) { setData(d); return; }
        } catch { localStorage.removeItem(cacheKey); }
      }

      const { from, to } = getDateRange();
      const [insiderRes, ownerRes, sentRes] = await Promise.all([
        proxyFetch(`${BASE_URL}/stock/insider-transactions?symbol=${symbol}&from=${from}&to=${to}`),
        proxyFetch(`${BASE_URL}/stock/ownership?symbol=${symbol}&limit=10`),
        proxyFetch(`${BASE_URL}/stock/insider-sentiment?symbol=${symbol}&from=${from}&to=${to}`),
      ]);

      const [insiderData, sentData] = await Promise.all([
        safeJson(insiderRes), safeJson(sentRes).catch(() => ({})),
      ]);
      const ownerData = await safeJson(ownerRes).catch(() => ({}));

      const transactions = (insiderData.data || [])
        .filter((t: any) => !t.isDerivative)
        .sort((a: any, b: any) => new Date(b.transactionDate || b.filingDate).getTime() - new Date(a.transactionDate || a.filingDate).getTime())
        .slice(0, 30);

      const institutions = ownerData.ownership || [];
      const sentiment = sentData.data || [];

      if (!transactions.length && !institutions.length) {
        throw new Error('No insider or institutional data found for this ticker.');
      }

      const d: InsiderData = { transactions, institutions, sentiment };
      safeSetItem(cacheKey, JSON.stringify({ ts: Date.now(), d }));
      setData(d);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch insider data.');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
}
