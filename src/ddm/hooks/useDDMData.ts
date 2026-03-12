import { useState } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';

const FINNHUB_URL = 'https://finnhub.io/api/v1';
const MASSIVE_DIV_URL = 'https://api.massive.com/stocks/v1/dividends';
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface DDMData {
  dividendsPerShareAnnual: number;
  beta: number;
  currentPrice: number;
  companyName: string;
  industry: string;
  eps: number;
  dividendYield: number;
  payoutRatio: number;
  recentDividends: { date: string; amount: number }[];
}

function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* quota */ }
}

const safeJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  if (!text || text.trim().startsWith('<')) throw new Error('API returned HTML instead of JSON. Try again later.');
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) throw new Error(`API: ${parsed.error}`);
    return parsed;
  } catch (e: any) {
    if (e.message?.startsWith('API:')) throw e;
    throw new Error('Invalid response from API.');
  }
};

export function useDDMData() {
  const [data, setData] = useState<DDMData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async (symbol: string) => {
    setLoading(true);
    setError('');
    try {
      const cacheKey = `ddm_${symbol}_v4`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, d } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) { setData(d); return; }
        } catch { localStorage.removeItem(cacheKey); }
      }

      const [massiveRes, metricRes, profileRes] = await Promise.all([
        proxyFetch(`${MASSIVE_DIV_URL}?ticker=${symbol}&limit=40&sort=ex_dividend_date.desc`).catch(() => null),
        proxyFetch(`${FINNHUB_URL}/stock/metric?symbol=${symbol}&metric=all`),
        proxyFetch(`${FINNHUB_URL}/stock/profile2?symbol=${symbol}`),
      ]);

      const [massiveData, metricData, profileData] = await Promise.all([
        massiveRes ? safeJson(massiveRes).catch(() => ({})) : Promise.resolve({}),
        safeJson(metricRes),
        safeJson(profileRes).catch(() => ({})),
      ]);

      const metrics = metricData?.metric || {};
      const beta = metrics.beta || 1.0;
      const eps = metrics.epsAnnual || metrics.epsTTM || 0;
      const divYield = metrics.dividendYieldIndicatedAnnual || 0;
      const payoutRatio = metrics.payoutRatioAnnual || 0;

      // Derive current price from market cap / shares (same approach as DCF module)
      const mktCap = (profileData?.marketCapitalization || 0) * 1e6;
      const sharesOut = (profileData?.shareOutstanding || 0) * 1e6;
      const currentPrice = sharesOut > 0 && mktCap > 0 ? mktCap / sharesOut : 0;

      // Extract recent dividends from Massive API (same as dividend-analysis tab)
      const allPayments = (Array.isArray(massiveData?.results) ? massiveData.results : [])
        .filter((p: any) => p.cash_amount > 0)
        .sort((a: any, b: any) => new Date(b.ex_dividend_date).getTime() - new Date(a.ex_dividend_date).getTime());

      const recentDividends = allPayments.slice(0, 12).map((p: any) => ({
        date: p.ex_dividend_date ?? '',
        amount: p.cash_amount,
      }));

      // Compute annual dividend: prefer Massive data (sum of last 4 recurring quarterly payments)
      // This matches dividend-analysis tab logic
      let divAnnual = metrics.dividendsPerShareAnnual || 0;
      if (allPayments.length >= 4 && divAnnual <= 0) {
        // Sum the 4 most recent payments as annualized dividend
        divAnnual = allPayments.slice(0, 4).reduce((sum: number, p: any) => sum + p.cash_amount, 0);
      } else if (allPayments.length > 0 && divAnnual <= 0) {
        // If fewer than 4 payments, annualize based on frequency
        const latestAmount = allPayments[0].cash_amount;
        divAnnual = latestAmount * 4; // assume quarterly
      }

      const result: DDMData = {
        dividendsPerShareAnnual: divAnnual,
        beta,
        currentPrice,
        companyName: profileData?.name || symbol,
        industry: profileData?.finnhubIndustry || '',
        eps,
        dividendYield: divYield,
        payoutRatio,
        recentDividends,
      };

      setData(result);
      safeSetItem(cacheKey, JSON.stringify({ ts: Date.now(), d: result }));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch dividend data.');
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
