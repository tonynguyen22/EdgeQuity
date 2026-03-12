import { useState } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';
import { safeSetItem } from '../utils/storage';
import type { NewsData } from '../types';

const BASE_URL = 'https://finnhub.io/api/v1';
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour (news is time-sensitive)

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

export function useNewsData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<NewsData | null>(null);

  const fetchData = async (symbol: string): Promise<NewsData | null> => {
    setLoading(true);
    setError('');
    try {
      const cacheKey = `news_${symbol}_v2`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, d } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            setData(d);
            return d;
          }
        } catch { localStorage.removeItem(cacheKey); }
      }

      const now = new Date();
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = now.toISOString().split('T')[0];

      const [newsRes, sentRes] = await Promise.all([
        proxyFetch(`${BASE_URL}/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}`),
        proxyFetch(`${BASE_URL}/news-sentiment?symbol=${symbol}`),
      ]);
      const newsData = await safeJson(newsRes);
      const sentData = await safeJson(sentRes).catch(() => ({}));

      const raw = Array.isArray(newsData) ? newsData : [];
      const sym = symbol.toUpperCase();
      const articles = raw.filter((a: any) => {
        const h = (a.headline || '').toUpperCase();
        const s = (a.summary || '').toUpperCase();
        return h.includes(sym) || s.includes(sym);
      });

      if (!articles.length && !sentData?.sentiment) {
        throw new Error('No news data found for this ticker. Try a major US-listed stock.');
      }

      const d: NewsData = { articles, sentiment: sentData };
      safeSetItem(cacheKey, JSON.stringify({ ts: Date.now(), d }));
      setData(d);
      return d;
    } catch (e: any) {
      setError(e.message || 'Failed to fetch news data.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError('');
  };

  return { data, loading, error, fetchData, reset };
}
