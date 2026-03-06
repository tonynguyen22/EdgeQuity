/* ── Financials — Data Fetching Hook ──────────────────────────────────── */
/* Fetches directly from SEC EDGAR Company Facts API — no backend needed */

import { useState } from 'react';
import type { FinancialsResponse, StatementLineItem, StatementType } from '../types';
import { getCached, setCache } from '../utils/storage';

// SEC EDGAR endpoints — proxied through Vite dev server to bypass CORS
// Proxy rules are defined in vite.config.ts:
//   /sec-api/*     → https://www.sec.gov/*
//   /edgar-search/* → https://efts.sec.gov/*
//   /edgar-facts/*  → https://data.sec.gov/*
const COMPANY_FACTS_URL = '/edgar-facts/api/xbrl/companyfacts';

// ── Ticker → CIK mapping (via proxied company_tickers.json) ──────────────
let _tickerMap: Record<string, { cik: string; name: string }> | null = null;

async function getTickerMap(): Promise<Record<string, { cik: string; name: string }>> {
    if (_tickerMap) return _tickerMap;

    // Check localStorage cache (7-day TTL)
    const cacheKey = 'edgar_ticker_map_v2';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
                _tickerMap = data;
                return data;
            }
        } catch { /* ignore */ }
    }

    // Fetch via proxy to bypass CORS
    const res = await fetch('/sec-api/files/company_tickers.json');
    if (!res.ok) throw new Error('Failed to load SEC ticker map. Please try again.');
    const json = await res.json();

    const map: Record<string, { cik: string; name: string }> = {};
    for (const entry of Object.values(json) as any[]) {
        map[entry.ticker.toUpperCase()] = {
            cik: String(entry.cik_str).padStart(10, '0'),
            name: entry.title || '',
        };
    }

    _tickerMap = map;
    try { localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: map })); } catch { /* ignore */ }
    return map;
}

async function lookupCIK(ticker: string): Promise<{ cik: string; name: string }> {
    const upper = ticker.toUpperCase();
    const map = await getTickerMap();
    const entry = map[upper];
    if (!entry) {
        throw new Error(`Ticker "${ticker}" not found. Only US-listed stocks (NYSE/NASDAQ) are supported.`);
    }
    return entry;
}

// ── Concept keys for each statement ──────────────────────────────────────
// The SEC API uses US-GAAP concept names as keys. We define the items we want
// for each financial statement, in display order.

interface ConceptDef { label: string; concepts: string[]; negate?: boolean }

const INCOME_CONCEPTS: ConceptDef[] = [
    { label: 'Revenue', concepts: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueNet'] },
    { label: 'Cost of Revenue', concepts: ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold'], negate: true },
    { label: 'Gross Profit', concepts: ['GrossProfit'] },
    { label: 'Research & Development', concepts: ['ResearchAndDevelopmentExpense'], negate: true },
    { label: 'Selling, General & Admin', concepts: ['SellingGeneralAndAdministrativeExpense'], negate: true },
    { label: 'Operating Expenses', concepts: ['OperatingExpenses'], negate: true },
    { label: 'Operating Income', concepts: ['OperatingIncomeLoss'] },
    { label: 'Interest Expense', concepts: ['InterestExpense', 'InterestExpenseNonoperating'], negate: true },
    { label: 'Other Income/Expense', concepts: ['NonoperatingIncomeExpense', 'OtherNonoperatingIncomeExpense'] },
    { label: 'Income Before Tax', concepts: ['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest', 'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'] },
    { label: 'Income Tax Expense', concepts: ['IncomeTaxExpenseBenefit'], negate: true },
    { label: 'Net Income', concepts: ['NetIncomeLoss'] },
    { label: 'EPS (Basic)', concepts: ['EarningsPerShareBasic'] },
    { label: 'EPS (Diluted)', concepts: ['EarningsPerShareDiluted'] },
    { label: 'Shares Outstanding (Basic)', concepts: ['WeightedAverageNumberOfSharesOutstandingBasic'] },
    { label: 'Shares Outstanding (Diluted)', concepts: ['WeightedAverageNumberOfDilutedSharesOutstanding'] },
];

const BALANCE_CONCEPTS: ConceptDef[] = [
    { label: 'Cash & Equivalents', concepts: ['CashAndCashEquivalentsAtCarryingValue'] },
    { label: 'Short-Term Investments', concepts: ['ShortTermInvestments', 'MarketableSecuritiesCurrent'] },
    { label: 'Accounts Receivable', concepts: ['AccountsReceivableNetCurrent'] },
    { label: 'Inventory', concepts: ['InventoryNet'] },
    { label: 'Total Current Assets', concepts: ['AssetsCurrent'] },
    { label: 'Property, Plant & Equipment', concepts: ['PropertyPlantAndEquipmentNet'] },
    { label: 'Goodwill', concepts: ['Goodwill'] },
    { label: 'Intangible Assets', concepts: ['IntangibleAssetsNetExcludingGoodwill'] },
    { label: 'Total Assets', concepts: ['Assets'] },
    { label: 'Accounts Payable', concepts: ['AccountsPayableCurrent'] },
    { label: 'Short-Term Debt', concepts: ['ShortTermBorrowings', 'CommercialPaper'] },
    { label: 'Total Current Liabilities', concepts: ['LiabilitiesCurrent'] },
    { label: 'Long-Term Debt', concepts: ['LongTermDebt', 'LongTermDebtNoncurrent'] },
    { label: 'Total Liabilities', concepts: ['Liabilities'] },
    { label: 'Common Stock', concepts: ['CommonStockValue'] },
    { label: 'Retained Earnings', concepts: ['RetainedEarningsAccumulatedDeficit'] },
    { label: 'Total Stockholders Equity', concepts: ['StockholdersEquity'] },
    { label: 'Total Liabilities & Equity', concepts: ['LiabilitiesAndStockholdersEquity'] },
];

const CASHFLOW_CONCEPTS: ConceptDef[] = [
    { label: 'Net Income', concepts: ['NetIncomeLoss'] },
    { label: 'Depreciation & Amortization', concepts: ['DepreciationDepletionAndAmortization', 'DepreciationAmortizationAndAccretionNet'] },
    { label: 'Stock-Based Compensation', concepts: ['ShareBasedCompensation'] },
    { label: 'Changes in Working Capital', concepts: ['IncreaseDecreaseInOperatingCapital'] },
    { label: 'Operating Cash Flow', concepts: ['NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'] },
    { label: 'Capital Expenditures', concepts: ['PaymentsToAcquirePropertyPlantAndEquipment'], negate: true },
    { label: 'Acquisitions', concepts: ['PaymentsToAcquireBusinessesNetOfCashAcquired'], negate: true },
    { label: 'Purchases of Investments', concepts: ['PaymentsToAcquireInvestments', 'PaymentsToAcquireAvailableForSaleSecuritiesDebt'], negate: true },
    { label: 'Investing Cash Flow', concepts: ['NetCashProvidedByUsedInInvestingActivities', 'NetCashProvidedByUsedInInvestingActivitiesContinuingOperations'] },
    { label: 'Dividends Paid', concepts: ['PaymentsOfDividends', 'PaymentsOfDividendsCommonStock'], negate: true },
    { label: 'Share Repurchases', concepts: ['PaymentsForRepurchaseOfCommonStock'], negate: true },
    { label: 'Debt Repayment', concepts: ['RepaymentsOfLongTermDebt', 'RepaymentsOfDebt'], negate: true },
    { label: 'Financing Cash Flow', concepts: ['NetCashProvidedByUsedInFinancingActivities', 'NetCashProvidedByUsedInFinancingActivitiesContinuingOperations'] },
    { label: 'Net Change in Cash', concepts: ['CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect', 'CashAndCashEquivalentsPeriodIncreaseDecrease'] },
];

// ── Extract data from SEC Company Facts JSON ────────────────────────────

function extractStatementItems(
    facts: Record<string, any>,
    conceptDefs: ConceptDef[],
    fiscalYears: number[],
): { items: StatementLineItem[]; periods: string[] } {
    const periods = fiscalYears.map(y => String(y));
    const items: StatementLineItem[] = [];

    for (const def of conceptDefs) {
        // Find the first matching concept in the facts
        let conceptData: any[] | null = null;
        for (const concept of def.concepts) {
            const entry = facts[concept];
            if (entry?.units) {
                // Get USD values (or shares for EPS/share counts)
                const unitKey = entry.units.USD ? 'USD' : entry.units['USD/shares'] ? 'USD/shares' : entry.units.shares ? 'shares' : Object.keys(entry.units)[0];
                conceptData = entry.units[unitKey] || null;
                if (conceptData?.length) break;
            }
        }

        if (!conceptData) {
            // Still add the row with null values so the table structure is consistent
            const values: Record<string, number | null> = {};
            for (const p of periods) values[p] = null;
            items.push({ label: def.label, values });
            continue;
        }

        // Filter to only 10-K filings (annual) and pick the right fiscal year values
        const annualData = conceptData.filter((d: any) => d.form === '10-K' && d.fy != null);

        const values: Record<string, number | null> = {};
        for (const fy of fiscalYears) {
            // Find entries for this fiscal year — prefer the one with the longest duration (full year)
            const candidates = annualData.filter((d: any) => d.fy === fy);
            if (candidates.length === 0) {
                values[String(fy)] = null;
                continue;
            }
            // Pick the entry with fp === 'FY' (full year), or the one with the longest frame
            const fyEntry = candidates.find((d: any) => d.fp === 'FY') || candidates[candidates.length - 1];
            values[String(fy)] = fyEntry.val != null ? Number(fyEntry.val) : null;
        }

        items.push({ label: def.label, values });
    }

    return { items, periods };
}

// ── Main fetch logic ─────────────────────────────────────────────────────

async function fetchFromEdgar(ticker: string): Promise<FinancialsResponse> {
    // Step 1: Get CIK from ticker (CORS-friendly EFTS search)
    const lookup = await lookupCIK(ticker);
    const cik = lookup.cik;

    // Step 2: Fetch Company Facts (data.sec.gov supports CORS)
    const url = `${COMPANY_FACTS_URL}/CIK${cik}.json`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
        throw new Error(`SEC EDGAR returned ${res.status}. The company may not have XBRL filings.`);
    }
    const json = await res.json();
    const facts = json.facts?.['us-gaap'] || {};

    if (Object.keys(facts).length === 0) {
        throw new Error('No US-GAAP financial data found for this company.');
    }

    // Step 3: Determine available fiscal years
    // Scan ALL revenue-related concepts + Assets to build the most complete FY list.
    // Some companies (e.g. AAPL) changed XBRL tags over time (SalesRevenueNet →
    // RevenueFromContractWithCustomerExcludingAssessedTax after ASC 606 adoption),
    // so relying on a single concept via || would miss years.
    const fyScanConcepts = [
        'Revenues',
        'RevenueFromContractWithCustomerExcludingAssessedTax',
        'RevenueFromContractWithCustomerIncludingAssessedTax',
        'SalesRevenueNet',
        'Assets',
    ];
    const allFYs: Set<number> = new Set();
    for (const concept of fyScanConcepts) {
        const entry = facts[concept];
        const data = entry?.units?.USD;
        if (!data) { console.log(`[FY-SCAN] ${concept} → NOT FOUND`); continue; }
        const matching = data.filter((d: any) => d.form === '10-K' && d.fp === 'FY' && d.fy != null);
        console.log(`[FY-SCAN] ${concept} → ${matching.length} entries, FYs:`, matching.map((d: any) => d.fy));
        for (const d of matching) {
            allFYs.add(Number(d.fy));
        }
    }

    // Take the last 6 fiscal years
    const fiscalYears: number[] = [...allFYs].sort((a, b) => a - b).slice(-6);
    console.log('[FY-SCAN] Final fiscal years:', fiscalYears);

    if (fiscalYears.length === 0) {
        throw new Error('No annual (10-K) data found for this company.');
    }

    // Step 4: Extract each statement
    const income = extractStatementItems(facts, INCOME_CONCEPTS, fiscalYears);
    const balance = extractStatementItems(facts, BALANCE_CONCEPTS, fiscalYears);
    const cashflow = extractStatementItems(facts, CASHFLOW_CONCEPTS, fiscalYears);

    return {
        ticker,
        company_name: json.entityName || ticker,
        cik,
        income_statement: income.items,
        balance_sheet: balance.items,
        cash_flow: cashflow.items,
        periods: income.periods,
    };
}

// ── Hook ─────────────────────────────────────────────────────────────────

interface UseFinancialsDataResult {
    tickerInput: string;
    setTickerInput: (v: string) => void;
    ticker: string;
    data: FinancialsResponse | null;
    loading: boolean;
    error: string;
    activeStatement: StatementType;
    setActiveStatement: (s: StatementType) => void;
    handleSearch: (e: React.FormEvent) => void;
    reset: () => void;
}

export function useFinancialsData(): UseFinancialsDataResult {
    const [tickerInput, setTickerInput] = useState('');
    const [ticker, setTicker] = useState('');
    const [data, setData] = useState<FinancialsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeStatement, setActiveStatement] = useState<StatementType>('income');

    const fetchData = async (sym: string) => {
        setLoading(true);
        setError('');
        try {
            // Check cache first
            const cached = getCached<FinancialsResponse>(sym);
            if (cached) {
                setData(cached);
                setTicker(sym);
                return;
            }

            const result = await fetchFromEdgar(sym);
            setData(result);
            setTicker(sym);
            setCache(sym, result);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch financial data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const sym = tickerInput.trim().toUpperCase();
        if (sym) {
            fetchData(sym);
        }
    };

    const reset = () => {
        setData(null);
        setTicker('');
        setError('');
        setTickerInput('');
        setActiveStatement('income');
    };

    return {
        tickerInput,
        setTickerInput,
        ticker,
        data,
        loading,
        error,
        activeStatement,
        setActiveStatement,
        handleSearch,
        reset,
    };
}
