import { useState } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';
import { safeSetItem } from '../utils/storage';
import type { AnnualEarningsRecord, EarningsRecord } from '../types';

const AV_URL = 'https://www.alphavantage.co/query';
const CACHE_TTL = 24 * 60 * 60 * 1000;

const parseNum = (v: string | undefined): number | null => {
  if (!v || v === 'None') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

export function useEarningsData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quarterly, setQuarterly] = useState<EarningsRecord[]>([]);
  const [annual, setAnnual] = useState<AnnualEarningsRecord[]>([]);

  const fetchData = async (symbol: string) => {
    setLoading(true);
    setError('');
    try {
      const cacheKey = `earnings_${symbol}_v5`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, d } = JSON.parse(cached);
          if (
            Date.now() - ts < CACHE_TTL &&
            d &&
            Array.isArray(d.quarterly) &&
            d.quarterly.length > 0
          ) {
            setQuarterly(d.quarterly);
            setAnnual(d.annual ?? []);
            return;
          }
        } catch { localStorage.removeItem(cacheKey); }
      }

      const res = await proxyFetch(`${AV_URL}?function=EARNINGS&symbol=${symbol}`);
      if (!res.ok) throw new Error(`Alpha Vantage request failed (${res.status}).`);
      const data = await res.json();

      if (data.Information) throw new Error('Alpha Vantage rate limit reached. Please try again later.');
      if (data['Error Message']) throw new Error(`No earnings data found for ${symbol}. Ensure it is a valid US-listed ticker.`);

      const rawQuarterly: EarningsRecord[] = (data.quarterlyEarnings ?? [])
        .slice(0, 20)
        .map((e: Record<string, string>) => {
          const dt = new Date(e.fiscalDateEnding);
          return {
            period: e.fiscalDateEnding,
            year: dt.getFullYear(),
            quarter: Math.ceil((dt.getMonth() + 1) / 3),
            actual: parseNum(e.reportedEPS),
            estimate: parseNum(e.estimatedEPS),
            surprise: parseNum(e.surprise),
            surprisePercent: parseNum(e.surprisePercentage),
            symbol,
          };
        });

      const rawAnnual: AnnualEarningsRecord[] = (data.annualEarnings ?? [])
        .slice(0, 5)
        .map((e: Record<string, string>) => ({
          fiscalYear: new Date(e.fiscalDateEnding).getFullYear().toString(),
          reportedEPS: parseNum(e.reportedEPS),
        }));

      if (rawQuarterly.length === 0 && rawAnnual.length === 0) {
        throw new Error(`No earnings data found for ${symbol}.`);
      }

      safeSetItem(cacheKey, JSON.stringify({ ts: Date.now(), d: { quarterly: rawQuarterly, annual: rawAnnual } }));
      setQuarterly(rawQuarterly);
      setAnnual(rawAnnual);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch earnings data.');
    } finally {
      setLoading(false);
    }
  };

  return { quarterly, annual, loading, error, fetchData };
}
