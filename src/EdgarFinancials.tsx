import React, { useState } from 'react';
import { Search, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const EDGAR_HEADERS = { 'User-Agent': 'ValuWise/1.0 contact@valuwise.app' };

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      Object.keys(localStorage)
        .filter(k => ['finnhub_', 'valuwise_', 'tech_', 'earnings_', 'insider_', 'news_', 'dividend_', 'edgar_'].some(p => k.startsWith(p)))
        .forEach(k => localStorage.removeItem(k));
      try { localStorage.setItem(key, value); } catch { /* skip */ }
    }
  }
}

// Extract annual values — tries USD first, falls back to any available currency unit
// Returns { values: { year: amountInMillions }, currency: string }
function extractAnnual(
  facts: any,
  taxonomy: string,
  concepts: string[],
  forceCurrency?: string
): { values: Record<string, number>; currency: string } {
  for (const concept of concepts) {
    const unitMap = facts.facts?.[taxonomy]?.[concept]?.units;
    if (!unitMap) continue;
    // Pick currency: forced > USD > first available monetary unit
    const unit = forceCurrency && unitMap[forceCurrency]
      ? forceCurrency
      : unitMap['USD']
        ? 'USD'
        : Object.keys(unitMap).find(u => u !== '1' && u !== 'shares' && u !== 'pure');
    if (!unit || !unitMap[unit]?.length) continue;
    const annual = (unitMap[unit] as any[]).filter(e => ['10-K', '20-F'].includes(e.form));
    if (!annual.length) continue;
    // Deduplicate by fiscal year-end (keep latest filed amendment)
    const byYear: Record<string, any> = {};
    for (const e of annual) {
      const yr = e.end.slice(0, 4);
      if (!byYear[yr] || e.filed > byYear[yr].filed) byYear[yr] = e;
    }
    const values: Record<string, number> = {};
    Object.entries(byYear)
      .sort(([a], [b]) => Number(b) - Number(a))
      .slice(0, 5)
      .forEach(([yr, e]) => { values[yr] = (e as any).val / 1e6; });
    if (Object.keys(values).length) return { values, currency: unit };
  }
  return { values: {}, currency: 'USD' };
}

// Get latest filing form type (10-K or 20-F)
function detectFormType(facts: any): string {
  const dei = facts.facts?.dei;
  if (!dei) return 'Unknown';
  // Check a few DEI concepts that include form info
  for (const concept of Object.values(dei) as any[]) {
    const entries = concept?.units?.['1'] || concept?.units?.USD || concept?.units?.shares;
    if (!entries?.length) continue;
    const annual = entries.find((e: any) => e.form === '20-F');
    if (annual) return '20-F';
    const annual10k = entries.find((e: any) => e.form === '10-K');
    if (annual10k) return '10-K';
  }
  return 'N/A';
}

interface FinancialData {
  entityName: string;
  taxonomy: string;
  formType: string;
  currency: string;
  years: string[];
  income: {
    revenue: Record<string, number>;
    grossProfit: Record<string, number>;
    operatingIncome: Record<string, number>;
    netIncome: Record<string, number>;
  };
  balance: {
    totalAssets: Record<string, number>;
    totalLiabilities: Record<string, number>;
    equity: Record<string, number>;
    longTermDebt: Record<string, number>;
    cash: Record<string, number>;
  };
  cashflow: {
    ocf: Record<string, number>;
    capex: Record<string, number>;
    fcf: Record<string, number>;
    dividendsPaid: Record<string, number>;
  };
}

const fmtM = (val: number | undefined, ccy: string) => {
  if (val === undefined || val === null || isNaN(val)) return '—';
  const abs = Math.abs(val);
  const sym = ccy === 'USD' ? '$' : ccy + ' ';
  const neg = val < 0;
  if (abs >= 1000) return `${neg ? '-' : ''}${sym}${(abs / 1000).toFixed(1)}B`;
  return `${neg ? '-' : ''}${sym}${abs.toFixed(0)}M`;
};

const fmtCapex = (val: number | undefined, ccy: string) => {
  if (val === undefined || val === null || isNaN(val)) return '—';
  const sym = ccy === 'USD' ? '$' : ccy + ' ';
  return `(${sym}${Math.abs(val).toFixed(0)}M)`;
};

export default function EdgarFinancials() {
  const [input, setInput] = useState('');
  const [sym, setSym] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<FinancialData | null>(null);

  const fetchData = async (symbol: string) => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const cacheKey = `edgar_${symbol}_v1`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, d } = JSON.parse(cached);
          if (Date.now() - ts < 24 * 60 * 60 * 1000) {
            setData(d);
            return;
          }
        } catch { localStorage.removeItem(cacheKey); }
      }

      // Step 1: Resolve CIK (cache 7 days)
      const tickerCacheKey = 'edgar_tickers_v1';
      let tickerMap: Record<string, any> = {};
      const tickerCached = localStorage.getItem(tickerCacheKey);
      if (tickerCached) {
        try {
          const { ts, d } = JSON.parse(tickerCached);
          if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) tickerMap = d;
        } catch { localStorage.removeItem(tickerCacheKey); }
      }
      if (!Object.keys(tickerMap).length) {
        const res = await fetch('/api/sec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://www.sec.gov/files/company_tickers.json' }),
        });
        if (!res.ok) throw new Error('Failed to load SEC company list.');
        tickerMap = await res.json();
        safeSetItem(tickerCacheKey, JSON.stringify({ ts: Date.now(), d: tickerMap }));
      }

      const entry = Object.values(tickerMap).find((e: any) => e.ticker?.toUpperCase() === symbol) as any;
      if (!entry) throw new Error(`Ticker "${symbol}" not found in SEC EDGAR. This tool works for SEC-registered companies (US stocks + ADRs like NVO, TSM). Check the exact ticker used in SEC filings.`);

      const cik = String(entry.cik_str).padStart(10, '0');

      // Step 2: Fetch companyfacts
      const factsRes = await fetch('/api/sec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json` }),
      });
      if (!factsRes.ok) throw new Error(`SEC EDGAR returned an error for ${symbol}. The company may not have XBRL financial data.`);
      const facts = await factsRes.json();

      // Step 3: Auto-detect taxonomy
      const hasIfrs = !!facts.facts?.['ifrs-full'];
      const taxonomy = hasIfrs ? 'ifrs-full' : 'us-gaap';
      const formType = detectFormType(facts);

      // Step 4: Extract concepts — detect currency from revenue, then force it for all line items
      const gaap = taxonomy === 'us-gaap';

      const revenueResult = extractAnnual(facts, taxonomy, gaap
        ? ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueGoodsNet']
        : ['Revenue', 'RevenueFromContractsWithCustomers', 'SalesAndOtherOperatingRevenue', 'NetRevenue']);

      // Use the detected currency for all subsequent extractions (important for non-USD ADRs like NVO/DKK)
      const currency = revenueResult.currency;
      const ex = (concepts: string[]) => extractAnnual(facts, taxonomy, concepts, currency).values;

      const revenue = revenueResult.values;

      const grossProfit = ex(gaap ? ['GrossProfit'] : ['GrossProfit']);

      const operatingIncome = ex(gaap
        ? ['OperatingIncomeLoss']
        : ['ProfitLossFromOperatingActivities', 'OperatingProfit', 'OperatingProfitLoss']);

      const netIncome = ex(gaap
        ? ['NetIncomeLoss', 'NetIncomeLossAvailableToCommonStockholdersBasic']
        : ['ProfitLoss', 'ProfitLossAttributableToOwnersOfParent', 'ProfitLossAttributableToEquityHoldersOfParentEntity']);

      const totalAssets = ex(['Assets']);

      const totalLiabilities = ex(['Liabilities']);

      const equity = ex(gaap
        ? ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest']
        : ['Equity', 'EquityAttributableToOwnersOfParent', 'EquityAttributableToEquityHoldersOfParentEntity']);

      const longTermDebt = ex(gaap
        ? ['LongTermDebt', 'LongTermDebtNoncurrent', 'LongTermNotesPayable']
        : ['NoncurrentPortionOfLongtermBorrowings', 'BorrowingsNoncurrent', 'LongtermBorrowingsNoncurrent', 'NonCurrentBorrowings']);

      const cash = ex(gaap
        ? ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsAndShortTermInvestments', 'Cash']
        : ['CashAndCashEquivalents', 'CashAndCashEquivalentsAndBankOverdrafts']);

      const ocf = ex(gaap
        ? ['NetCashProvidedByUsedInOperatingActivities']
        : ['CashFlowsFromUsedInOperatingActivities', 'CashFlowsFromOperatingActivities']);

      // CapEx: always reported as outflow (positive number in SEC); take abs() to normalise sign
      const capexRaw = ex(gaap
        ? ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets']
        : ['PurchaseOfPropertyPlantAndEquipment', 'AcquisitionsOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities', 'PurchaseOfPropertyPlantAndEquipmentIntangibleAssetsAndOtherLongtermAssets']);
      const capex: Record<string, number> = {};
      Object.entries(capexRaw).forEach(([yr, v]) => { capex[yr] = Math.abs(v); });

      const dividendsPaid = ex(gaap
        ? ['PaymentsOfDividends', 'PaymentsOfDividendsCommonStock', 'PaymentsOfOrdinaryDividends']
        : ['DividendsPaid', 'DividendsPaidClassifiedAsFinancingActivities', 'DividendsPaidToEquityHoldersOfParent']);

      // FCF = OCF - CapEx
      const fcf: Record<string, number> = {};
      const allYears = [...new Set([...Object.keys(ocf), ...Object.keys(capex)])].sort((a, b) => Number(b) - Number(a)).slice(0, 5);
      for (const yr of allYears) {
        if (ocf[yr] !== undefined && capex[yr] !== undefined) fcf[yr] = ocf[yr] - capex[yr];
      }

      // Determine years from revenue (most reliable) falling back to assets
      const primaryYears = Object.keys(revenue).length
        ? Object.keys(revenue).sort((a, b) => Number(b) - Number(a))
        : Object.keys(totalAssets).sort((a, b) => Number(b) - Number(a));
      const years = primaryYears.slice(0, 5);

      if (!years.length) throw new Error(`No XBRL financial data found for ${symbol}. The company may not file structured financials with the SEC.`);

      const d: FinancialData = {
        entityName: facts.entityName || entry.title,
        taxonomy,
        formType,
        currency,
        years,
        income: { revenue, grossProfit, operatingIncome, netIncome },
        balance: { totalAssets, totalLiabilities, equity, longTermDebt, cash },
        cashflow: { ocf, capex, fcf, dividendsPaid },
      };

      safeSetItem(cacheKey, JSON.stringify({ ts: Date.now(), d }));
      setData(d);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch EDGAR data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (s) { setSym(s); fetchData(s); }
  };

  const exportExcel = () => {
    if (!data) return;
    const { years, income, balance, cashflow, currency: ccy } = data;
    const yrs = [...years].reverse();
    const ccyLabel = `(${ccy}M)`;

    const buildSheet = (rows: [string, Record<string, number>][], neg?: string[]) => {
      const header = ['Line Item', ...yrs.map(y => `FY ${y}`)];
      const body = rows.map(([label, vals]) => {
        const isNeg = neg?.includes(label);
        return [label, ...yrs.map(y => {
          const v = vals[y];
          return v !== undefined ? (isNeg ? -Math.abs(v) : v) : null;
        })];
      });
      return XLSX.utils.aoa_to_sheet([header, ...body]);
    };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildSheet([
      [`Revenue ${ccyLabel}`, income.revenue],
      [`Gross Profit ${ccyLabel}`, income.grossProfit],
      [`Operating Income ${ccyLabel}`, income.operatingIncome],
      [`Net Income ${ccyLabel}`, income.netIncome],
    ]), 'Income Statement');
    XLSX.utils.book_append_sheet(wb, buildSheet([
      [`Total Assets ${ccyLabel}`, balance.totalAssets],
      [`Total Liabilities ${ccyLabel}`, balance.totalLiabilities],
      [`Stockholders' Equity ${ccyLabel}`, balance.equity],
      [`Long-term Debt ${ccyLabel}`, balance.longTermDebt],
      [`Cash & Equivalents ${ccyLabel}`, balance.cash],
    ]), 'Balance Sheet');
    XLSX.utils.book_append_sheet(wb, buildSheet([
      [`Operating Cash Flow ${ccyLabel}`, cashflow.ocf],
      [`Capital Expenditures ${ccyLabel}`, cashflow.capex],
      [`Free Cash Flow ${ccyLabel}`, cashflow.fcf],
      [`Dividends Paid ${ccyLabel}`, cashflow.dividendsPaid],
    ], [`Capital Expenditures ${ccyLabel}`]), 'Cash Flow');

    XLSX.writeFile(wb, `${sym}_EDGAR_Financials.xlsx`);
  };

  const TableSection = ({ title, rows }: { title: string; rows: { label: string; vals: Record<string, number>; neg?: boolean; bold?: boolean }[] }) => {
    if (!data) return null;
    const { years, currency: ccy } = data;
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{ccy} millions (from SEC EDGAR XBRL)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400 w-52">Line Item</th>
                {years.map(yr => (
                  <th key={yr} className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 tabular-nums">FY {yr}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, vals, neg, bold }) => (
                <tr key={label} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors">
                  <td className={`px-5 py-2.5 ${bold ? 'font-semibold text-slate-200' : 'text-slate-400'} text-xs`}>{label}</td>
                  {years.map(yr => {
                    const v = vals[yr];
                    const display = neg ? fmtCapex(v, ccy) : fmtM(v, ccy);
                    const color = v === undefined || v === null || isNaN(v)
                      ? 'text-slate-600'
                      : neg
                        ? 'text-red-400'
                        : v < 0
                          ? 'text-red-400'
                          : bold
                            ? 'text-white'
                            : 'text-slate-200';
                    return (
                      <td key={yr} className={`px-4 py-2.5 text-right tabular-nums text-xs font-medium ${color}`}>
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">Pull Financials</h2>
        <p className="text-slate-400 text-sm">Raw SEC EDGAR financials — works for US stocks and ADRs (NVO, TSM, ASML).</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter ticker (e.g. AAPL, NVO, TSM)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase transition-all"
        />
        <button type="submit" disabled={!input.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Pull Data
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 py-8 max-w-xl mx-auto">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Fetching from SEC EDGAR...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Company info strip */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{data.entityName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Source: SEC EDGAR XBRL · {sym}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${data.formType === '20-F' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                {data.formType}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${data.taxonomy === 'ifrs-full' ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                {data.taxonomy === 'ifrs-full' ? 'IFRS' : 'US-GAAP'}
              </span>
              <button
                onClick={exportExcel}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Income Statement */}
          <TableSection
            title="Income Statement"
            rows={[
              { label: 'Revenue', vals: data.income.revenue, bold: true },
              { label: 'Gross Profit', vals: data.income.grossProfit },
              { label: 'Operating Income', vals: data.income.operatingIncome },
              { label: 'Net Income', vals: data.income.netIncome, bold: true },
            ]}
          />

          {/* Balance Sheet */}
          <TableSection
            title="Balance Sheet"
            rows={[
              { label: 'Total Assets', vals: data.balance.totalAssets, bold: true },
              { label: 'Total Liabilities', vals: data.balance.totalLiabilities },
              { label: "Stockholders' Equity", vals: data.balance.equity, bold: true },
              { label: 'Long-term Debt', vals: data.balance.longTermDebt },
              { label: 'Cash & Equivalents', vals: data.balance.cash },
            ]}
          />

          {/* Cash Flow */}
          <TableSection
            title="Cash Flow Statement"
            rows={[
              { label: 'Operating Cash Flow', vals: data.cashflow.ocf, bold: true },
              { label: 'Capital Expenditures', vals: data.cashflow.capex, neg: true },
              { label: 'Free Cash Flow', vals: data.cashflow.fcf, bold: true },
              { label: 'Dividends Paid', vals: data.cashflow.dividendsPaid },
            ]}
          />

          <p className="text-xs text-slate-600 pb-2">
            Data sourced from SEC EDGAR XBRL filings. Values in {data.currency} millions. CapEx shown as outflow. FCF = OCF - CapEx. For informational purposes only.
          </p>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="max-w-xl mx-auto space-y-3">
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-2">
            <p className="text-sm font-medium text-slate-300">What you'll see here</p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">•</span>Income Statement — Revenue, Gross Profit, Operating Income, Net Income (5 years)</li>
              <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">•</span>Balance Sheet — Assets, Liabilities, Equity, Debt, Cash</li>
              <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">•</span>Cash Flow — OCF, CapEx, Free Cash Flow, Dividends Paid</li>
              <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">•</span>Export to Excel with 3 sheets</li>
            </ul>
          </div>
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-400 shrink-0" />
              <p className="text-xs font-medium text-teal-400">Works for ADRs</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unlike Finnhub, SEC EDGAR has filings for all SEC-registered foreign companies. ADRs like NVO (Novo Nordisk) and TSM (Taiwan Semi) file Form 20-F and report under IFRS — this tool handles both automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
