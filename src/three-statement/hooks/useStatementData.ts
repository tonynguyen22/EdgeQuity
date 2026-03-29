import { useState } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';
import { safeSetItem } from '../../utils/storage';
import type { HistoricalBase } from '../types';

const FMP_URL = 'https://financialmodelingprep.com/stable';
const FINNHUB_URL = 'https://finnhub.io/api/v1';
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Tries to read the DCF cache first (`fmp_{sym}_dcf_v1`).
 * If not cached, fetches fresh from FMP /stable/ and saves to the same cache key so DCF can reuse it.
 */
export function useStatementData() {
  const [historicals, setHistoricals] = useState<HistoricalBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyName, setCompanyName] = useState('');

  const fetchData = async (symbol: string) => {
    setLoading(true);
    setError('');
    try {
      // ── Try shared DCF cache first ──────────────────────────────
      const dcfCacheKey = `fmp_${symbol}_dcf_v1`;
      const cached = localStorage.getItem(dcfCacheKey);
      let incStmt: Record<string, unknown>[] | null = null;
      let balSheet: Record<string, unknown>[] | null = null;
      let cashFlow: Record<string, unknown>[] | null = null;
      let profileName = symbol;

      if (cached) {
        try {
          const { timestamp, data: cachedData } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL && cachedData?.incomeStatements?.length) {
            incStmt = cachedData.incomeStatements;
            balSheet = cachedData.balanceSheets || [];
            cashFlow = cachedData.cashFlows || [];
            profileName = cachedData.profile?.name || symbol;
          }
        } catch { localStorage.removeItem(dcfCacheKey); }
      }

      // ── If no cache, fetch fresh from FMP /stable/ ──────────────
      if (!incStmt) {
        const [resIc, resBs, resCf, resProfile] = await Promise.all([
          proxyFetch(`${FMP_URL}/income-statement?symbol=${symbol}&period=annual&limit=5`),
          proxyFetch(`${FMP_URL}/balance-sheet-statement?symbol=${symbol}&period=annual&limit=5`),
          proxyFetch(`${FMP_URL}/cash-flow-statement?symbol=${symbol}&period=annual&limit=5`),
          proxyFetch(`${FINNHUB_URL}/stock/profile2?symbol=${symbol}`),
        ]);

        if (!resIc.ok || !resBs.ok || !resCf.ok) {
          const failedRes = [resIc, resBs, resCf].find(r => !r.ok);
          throw new Error(`FMP request failed (${failedRes?.status ?? 'unknown'})`);
        }

        const [icData, bsData, cfData, profData] = await Promise.all([
          resIc.json(), resBs.json(), resCf.json(),
          resProfile.ok ? resProfile.json() : null,
        ]);

        if (!Array.isArray(icData) || icData.length === 0) {
          throw new Error('No income statement data available for this ticker.');
        }

        incStmt = icData;
        balSheet = Array.isArray(bsData) ? bsData : [];
        cashFlow = Array.isArray(cfData) ? cfData : [];
        profileName = profData?.name || symbol;

        // Save to shared DCF cache so both modules benefit
        safeSetItem(dcfCacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: {
            incomeStatements: incStmt,
            balanceSheets: balSheet,
            cashFlows: cashFlow,
            profile: profData || {},
            metrics: {},
          },
        }));
      }

      setCompanyName(profileName);

      // ── Build HistoricalBase rows ──────────────────────────────
      // Sort ascending by date
      const sortByDate = (arr: Record<string, unknown>[]) =>
        [...arr].sort((a, b) =>
          new Date(String(a.date || a.calendarYear)).getTime() - new Date(String(b.date || b.calendarYear)).getTime()
        );

      const isSorted = sortByDate(incStmt!);
      const bsSorted = sortByDate(balSheet || []);
      const cfSorted = sortByDate(cashFlow || []);

      const n = (obj: Record<string, unknown>, key: string): number => Number(obj[key]) || 0;

      const rows: HistoricalBase[] = isSorted.map((is, i: number) => {
        const bs: Record<string, unknown> = bsSorted[i] || {};
        const cf: Record<string, unknown> = cfSorted[i] || {};
        const year = String(is.calendarYear || (is.date ? new Date(String(is.date)).getFullYear() : `Y${i + 1}`));
        return {
          year,
          revenue: n(is, 'revenue'),
          cogs: n(is, 'costOfRevenue'),
          grossProfit: n(is, 'grossProfit'),
          sga: n(is, 'sellingGeneralAndAdministrativeExpenses') + n(is, 'otherExpenses'),
          da: n(is, 'depreciationAndAmortization'),
          ebit: n(is, 'operatingIncome'),
          interestExpense: n(is, 'interestExpense'),
          ebt: n(is, 'incomeBeforeTax'),
          tax: n(is, 'incomeTaxExpense'),
          netIncome: n(is, 'netIncome'),
          totalAssets: n(bs, 'totalAssets'),
          totalDebt: n(bs, 'longTermDebt') + n(bs, 'shortTermDebt'),
          cash: n(bs, 'cashAndCashEquivalents'),
          ppe: n(bs, 'propertyPlantEquipmentNet'),
          receivables: n(bs, 'netReceivables'),
          inventory: n(bs, 'inventory'),
          payables: n(bs, 'accountPayables'),
          totalEquity: n(bs, 'totalStockholdersEquity'),
          capex: Math.abs(n(cf, 'capitalExpenditure')),
          cfo: n(cf, 'operatingCashFlow'),
          cfi: n(cf, 'netCashUsedForInvestingActivites'),
          cff: n(cf, 'netCashUsedProvidedByFinancingActivities'),
        };
      });

      setHistoricals(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setHistoricals([]);
    setError('');
    setCompanyName('');
  };

  return { historicals, loading, error, companyName, fetchData, reset };
}
