import { useState } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';
import { safeSetItem } from '../utils/storage';
import type { DividendData } from '../types';

const FINNHUB_URL = 'https://finnhub.io/api/v1';
const MASSIVE_DIV_URL = 'https://api.massive.com/stocks/v1/dividends';
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

export function useDividendData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<DividendData | null>(null);

  const fetchData = async (symbol: string) => {
    setLoading(true);
    setError('');
    try {
      const cacheKey = `dividend_${symbol}_v5`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, d } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) { setData(d); return; }
        } catch { localStorage.removeItem(cacheKey); }
      }

      const [massiveRes, metricRes, finRes, priceRes] = await Promise.all([
        proxyFetch(`${MASSIVE_DIV_URL}?ticker=${symbol}&limit=40&sort=ex_dividend_date.desc`).catch(() => null),
        proxyFetch(`${FINNHUB_URL}/stock/metric?symbol=${symbol}&metric=all`),
        proxyFetch(`${FINNHUB_URL}/stock/financials-reported?symbol=${symbol}&freq=annual`),
        proxyFetch(`${FINNHUB_URL}/stock/quote?symbol=${symbol}`),
      ]);

      const [massiveData, metricData, finData, priceData] = await Promise.all([
        massiveRes ? safeJson(massiveRes).catch(() => ({})) : Promise.resolve({}),
        safeJson(metricRes),
        safeJson(finRes).catch(() => ({ data: [] })),
        safeJson(priceRes).catch(() => ({})),
      ]);

      const payments = (Array.isArray(massiveData?.results) ? massiveData.results : [])
        .filter((p: any) => p.cash_amount > 0)
        .map((p: any) => ({
          date: p.ex_dividend_date ?? '',
          exDate: p.ex_dividend_date ?? '',
          amount: p.cash_amount,
          payDate: p.pay_date ?? '',
          type: p.distribution_type ?? '',
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const metrics = metricData?.metric ?? {};
      const financials = (finData?.data || []).slice(0, 3);
      const currentPrice = priceData?.c ?? 0;

      if (!payments.length && !metrics.dividendYieldIndicatedAnnual && !metrics.dividendsPerShareAnnual && !metrics.payoutRatioAnnual) {
        throw new Error(`${symbol} does not appear to pay dividends, or no dividend data is available.`);
      }

      let fcfTTM = metrics['freeCashFlowTTM'] ?? metrics['fcfTTM'] ?? null;
      if (!fcfTTM && financials.length > 0) {
        const cf = financials[0]?.report?.cf ?? [];
        const ocf = cf.find((x: any) => x.concept === 'us-gaap_NetCashProvidedByUsedInOperatingActivities')?.value ?? 0;
        const capex = Math.abs(cf.find((x: any) => x.concept === 'us-gaap_PaymentsToAcquirePropertyPlantAndEquipment')?.value ?? 0);
        fcfTTM = parseFloat(ocf) - capex || null;
      }

      const d: DividendData = { payments, metrics, currentPrice, fcfTTM };
      safeSetItem(cacheKey, JSON.stringify({ ts: Date.now(), d }));
      setData(d);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch dividend data.');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
}
