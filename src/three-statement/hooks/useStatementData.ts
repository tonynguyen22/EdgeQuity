import { useState } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';
import type { HistoricalBase } from '../types';

const FMP_URL = 'https://financialmodelingprep.com/stable';
const FINNHUB_URL = 'https://finnhub.io/api/v1';
const CACHE_TTL = 24 * 60 * 60 * 1000;

function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* quota */ }
}

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
      let incStmt: any[] | null = null;
      let balSheet: any[] | null = null;
      let cashFlow: any[] | null = null;
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
      const isSorted = [...incStmt!].sort((a: any, b: any) =>
        new Date(a.date || a.calendarYear).getTime() - new Date(b.date || b.calendarYear).getTime()
      );
      const bsSorted = [...(balSheet || [])].sort((a: any, b: any) =>
        new Date(a.date || a.calendarYear).getTime() - new Date(b.date || b.calendarYear).getTime()
      );
      const cfSorted = [...(cashFlow || [])].sort((a: any, b: any) =>
        new Date(a.date || a.calendarYear).getTime() - new Date(b.date || b.calendarYear).getTime()
      );

      const rows: HistoricalBase[] = isSorted.map((is: any, i: number) => {
        const bs = bsSorted[i] || {};
        const cf = cfSorted[i] || {};
        const year = is.calendarYear || (is.date ? new Date(is.date).getFullYear().toString() : `Y${i + 1}`);
        return {
          year,
          revenue: is.revenue || 0,
          cogs: is.costOfRevenue || 0,
          grossProfit: is.grossProfit || 0,
          sga: (is.sellingGeneralAndAdministrativeExpenses || 0) + (is.otherExpenses || 0),
          da: is.depreciationAndAmortization || 0,
          ebit: is.operatingIncome || 0,
          interestExpense: is.interestExpense || 0,
          ebt: is.incomeBeforeTax || 0,
          tax: is.incomeTaxExpense || 0,
          netIncome: is.netIncome || 0,
          totalAssets: bs.totalAssets || 0,
          totalDebt: (bs.longTermDebt || 0) + (bs.shortTermDebt || 0),
          cash: bs.cashAndCashEquivalents || 0,
          ppe: bs.propertyPlantEquipmentNet || 0,
          receivables: bs.netReceivables || 0,
          inventory: bs.inventory || 0,
          payables: bs.accountPayables || 0,
          totalEquity: bs.totalStockholdersEquity || 0,
          capex: Math.abs(cf.capitalExpenditure || 0),
          cfo: cf.operatingCashFlow || 0,
          cfi: cf.netCashUsedForInvestingActivites || 0,
          cff: cf.netCashUsedProvidedByFinancingActivities || 0,
        };
      });

      setHistoricals(rows);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data');
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
