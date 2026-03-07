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

function isDepreciationLikeConcept(conceptName: string): boolean {
    const lower = conceptName.toLowerCase();
    return lower.includes('depreci') || lower.includes('amorti') || lower.includes('depletion');
}

function pickUnits(entry: any): any[] | null {
    if (!entry?.units) return null;
    const units = entry.units;
    const unitKey = units.USD ? 'USD' : units['USD/shares'] ? 'USD/shares' : units.shares ? 'shares' : Object.keys(units)[0];
    const values = unitKey ? units[unitKey] : null;
    return values?.length ? values : null;
}

function toAnnual10KEntries(values: any[] | null): any[] {
    if (!values?.length) return [];
    return values.filter((d: any) => d.form === '10-K' && d.fy != null);
}

function findCustomDepreciationSeries(allFacts: Record<string, any>): any[] | null {
    let bestAnnualSeries: any[] | null = null;
    for (const [namespace, concepts] of Object.entries(allFacts)) {
        if (namespace === 'dei') continue;
        const conceptMap = concepts as Record<string, any>;
        for (const [conceptName, entry] of Object.entries(conceptMap)) {
            if (!isDepreciationLikeConcept(conceptName)) continue;
            const annualData = toAnnual10KEntries(pickUnits(entry));
            if (!annualData.length) continue;
            if (!bestAnnualSeries || annualData.length > bestAnnualSeries.length) {
                bestAnnualSeries = annualData;
            }
        }
    }
    return bestAnnualSeries;
}

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
    { label: 'Depreciation & Amortization', concepts: ['DepreciationDepletionAndAmortization', 'DepreciationAmortizationAndAccretionNet', 'Depreciation', 'AmortizationOfIntangibleAssets'] },
    { label: 'Research & Development', concepts: ['ResearchAndDevelopmentExpense'], negate: true },
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

    // We now receive the FULL facts object, containing multiple namespaces (us-gaap, tsla, dei, etc.)
    const usGaap = facts['us-gaap'] || {};

    for (const def of conceptDefs) {
        // Find the first matching concept in the us-gaap namespace
        let conceptData: any[] | null = null;
        for (const concept of def.concepts) {
            const entry = usGaap[concept];
            conceptData = pickUnits(entry);
            if (conceptData?.length) break;
        }

        let annualData = toAnnual10KEntries(conceptData);

        // Check custom namespaces for D&A when standard tags are missing OR only non-annual values.
        // Some issuers (including TSLA) publish annual D&A under custom concepts.
        if (def.label === 'Depreciation & Amortization' && annualData.length === 0) {
            const customAnnualSeries = findCustomDepreciationSeries(facts);
            if (customAnnualSeries?.length) {
                annualData = customAnnualSeries;
            }
        }

        if (annualData.length === 0) {
            // Still add the row with null values so the table structure is consistent
            const values: Record<string, number | null> = {};
            for (const p of periods) values[p] = null;
            items.push({ label: def.label, values });
            continue;
        }

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
        // Accept fp === 'FY', 'Q4', or missing fp — older XBRL filings often
        // tag annual data with Q4 or omit fp entirely.
        const matching = data.filter(
            (d: any) => d.form === '10-K' && d.fy != null && (!d.fp || d.fp === 'FY' || d.fp === 'Q4')
        );
        // Deduplicate per fiscal year: prefer fp==='FY', then 'Q4', then whatever
        const byYear = new Map<number, any>();
        for (const d of matching) {
            const fy = Number(d.fy);
            const existing = byYear.get(fy);
            if (!existing || (d.fp === 'FY' && existing.fp !== 'FY')) {
                byYear.set(fy, d);
            }
        }
        console.log(`[FY-SCAN] ${concept} → ${byYear.size} unique FYs:`, [...byYear.keys()]);
        for (const fy of byYear.keys()) {
            allFYs.add(fy);
        }
    }

    // Take the last 5 fiscal years
    const fiscalYears: number[] = [...allFYs].sort((a, b) => a - b).slice(-5);
    console.log('[FY-SCAN] Final fiscal years:', fiscalYears);

    if (fiscalYears.length === 0) {
        throw new Error('No annual (10-K) data found for this company.');
    }

    // Step 4: Extract each statement
    // We pass the full json.facts object so we can scan company-specific namespaces for D&A if needed
    const allFacts = json.facts || {};
    const income = extractStatementItems(allFacts, INCOME_CONCEPTS, fiscalYears);
    const balance = extractStatementItems(allFacts, BALANCE_CONCEPTS, fiscalYears);
    const cashflow = extractStatementItems(allFacts, CASHFLOW_CONCEPTS, fiscalYears);
    const rdFactCandidates = Object.entries(allFacts)
        .filter(([namespace]) => namespace !== 'dei')
        .flatMap(([namespace, concepts]) => Object.entries(concepts as Record<string, any>)
            .filter(([conceptName]) => /research|development/i.test(conceptName))
            .map(([conceptName, entry]) => {
                const units = entry?.units || {};
                const unitKey = units.USD ? 'USD' : Object.keys(units)[0];
                const annualEntries = unitKey
                    ? (units[unitKey] || []).filter((d: any) => d.form === '10-K' && d.fy != null)
                    : [];
                return {
                    namespace,
                    conceptName,
                    unitKey: unitKey || null,
                    annualCount: annualEntries.length,
                    years: [...new Set<number>(annualEntries.map((d: any) => Number(d.fy)))].sort((a: number, b: number) => a - b),
                };
            }))
        .filter(candidate => candidate.annualCount > 0)
        .slice(0, 12);
    const incomeRdRow = income.items.find(item => item.label === 'Research & Development') || null;
    const cashflowRdRow = cashflow.items.find(item => item.label === 'Research & Development') || null;
    // #region agent log
    fetch('http://127.0.0.1:7415/ingest/2e9edde8-908a-4a40-98d1-78f8aa755831',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'832eac'},body:JSON.stringify({sessionId:'832eac',runId:'financials-rd',hypothesisId:'H5',location:'src/financials/hooks/useFinancialsData.ts:fetchFromEdgar',message:'Financials R&D fact coverage',data:{ticker,periods:income.periods,rdFactCandidates,cashflowConceptHasRdRow:CASHFLOW_CONCEPTS.some(def=>def.label==='Research & Development'),incomeHasRdRow:!!incomeRdRow,incomeRdValues:incomeRdRow?.values ?? null,cashflowHasRdRow:!!cashflowRdRow,cashflowRdValues:cashflowRdRow?.values ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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
            // #region agent log
            fetch('http://127.0.0.1:7415/ingest/2e9edde8-908a-4a40-98d1-78f8aa755831',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'832eac'},body:JSON.stringify({sessionId:'832eac',runId:'financials-rd',hypothesisId:'H4',location:'src/financials/hooks/useFinancialsData.ts:fetchData',message:'Financials cache usage',data:{ticker:sym,cacheHit:!!cached},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
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
