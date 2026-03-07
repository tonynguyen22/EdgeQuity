/* ── Peer Analysis — Data Fetching Hook ───────────────────────────────── */

import { useState } from 'react';
import type { PeerData, PeerSuggestion } from '../types';
import { safeSetItem } from '../utils/storage';
import { proxyFetch } from '../../utils/proxyFetch';

const BASE_URL = 'https://finnhub.io/api/v1';

/* ── fetchStockData (internal) ─────────────────────────────────────────── */

async function fetchStockData(symbol: string): Promise<PeerData | null> {
    if (!symbol) return null;
    try {
        const cacheKey = `finnhub_${symbol}_comp_data_v5`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) return data;
            } catch { localStorage.removeItem(cacheKey); }
        }

        const [resFin, resProf, resMetric] = await Promise.all([
            proxyFetch(`${BASE_URL}/stock/financials-reported?symbol=${symbol}&freq=annual`),
            proxyFetch(`${BASE_URL}/stock/profile2?symbol=${symbol}`),
            proxyFetch(`${BASE_URL}/stock/metric?symbol=${symbol}&metric=all`),
        ]);
        const [finData, profData, metricData] = await Promise.all([
            resFin.json(), resProf.json(), resMetric.json(),
        ]);

        if (!profData.ticker || !metricData.metric) return null;

        const profile = profData;
        const metrics = metricData.metric;
        const marketCap = (parseFloat(profile.marketCapitalization) || parseFloat(metrics.marketCapitalization) || 0) * 1e6;
        const sharesOut = (parseFloat(profile.shareOutstanding) * 1e6) || 0;

        if (!finData.data || finData.data.length === 0) return null;

        const financials = finData.data;

        const findConcept = (section: any[], concepts: string[]) => {
            if (!section) return 0;
            for (const concept of concepts) {
                const item = section.find((i: any) => i.concept === concept);
                if (item) return parseFloat(item.value);
            }
            return 0;
        };

        const latestReport = financials[0].report;
        const prevReport = financials.length > 1 ? financials[1].report : null;
        const ic = latestReport.ic;
        const bs = latestReport.bs;
        const cf = latestReport.cf;

        const getRevenue = (incomeStatement: any[] | undefined) => {
            const directRevenue = findConcept(incomeStatement ?? [], [
                'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax',
                'us-gaap_SalesRevenueNet',
                'us-gaap_Revenues',
                'ifrs-full_Revenue',
                'ifrs-full_RevenueFromContractsWithCustomers',
            ]);
            if (directRevenue > 0) return directRevenue;

            // Banks/financials often report net interest + non-interest income instead of "Revenue".
            const nonInterestIncome = findConcept(incomeStatement ?? [], [
                'us-gaap_NoninterestIncome',
                'ifrs-full_FeeAndCommissionIncome',
            ]);
            const netInterestIncome = findConcept(incomeStatement ?? [], [
                'us-gaap_InterestIncomeExpenseNet',
                'ifrs-full_NetInterestIncome',
            ]);
            const interestIncome = findConcept(incomeStatement ?? [], [
                'us-gaap_InterestIncomeOperating',
                'us-gaap_InterestAndDividendIncomeOperating',
                'ifrs-full_InterestRevenueCalculatedUsingEffectiveInterestMethod',
            ]);
            const interestExpense = Math.abs(findConcept(incomeStatement ?? [], [
                'us-gaap_InterestExpense',
                'us-gaap_InterestAndDebtExpense',
                'ifrs-full_FinanceCosts',
            ]));
            const derivedNetInterest = interestIncome > 0 ? Math.max(0, interestIncome - interestExpense) : 0;
            const bankRevenue = nonInterestIncome + (netInterestIncome > 0 ? netInterestIncome : derivedNetInterest);
            return bankRevenue > 0 ? bankRevenue : 0;
        };

        const rev = getRevenue(ic);
        const prevRev = prevReport ? getRevenue(prevReport.ic) : rev;
        const revGrowth = prevRev ? (rev - prevRev) / prevRev : 0;

        let ebit = findConcept(ic, ['us-gaap_OperatingIncomeLoss', 'ifrs-full_ProfitLossFromOperatingActivities']);
        if (!ebit) {
            const ebt = findConcept(ic, [
                'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
                'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
                'ifrs-full_ProfitLossBeforeTax',
            ]);
            const intExp = Math.abs(findConcept(ic, ['us-gaap_InterestExpense', 'us-gaap_InterestAndDebtExpense', 'ifrs-full_FinanceCosts']));
            const intInc = Math.abs(findConcept(ic, ['us-gaap_InvestmentIncomeInterest', 'us-gaap_InterestAndDividendIncomeOperating', 'ifrs-full_FinanceIncome']));
            if (ebt) ebit = ebt + intExp - intInc;
        }
        if (!ebit && rev > 0) {
            const gp2 = findConcept(ic, ['us-gaap_GrossProfit', 'ifrs-full_GrossProfit']) ||
                (rev - findConcept(ic, ['us-gaap_CostOfRevenue', 'us-gaap_CostOfGoodsAndServicesSold', 'us-gaap_CostOfGoodsSold', 'us-gaap_CostOfServices']));
            const sga = Math.abs(findConcept(ic, ['us-gaap_SellingGeneralAndAdministrativeExpense', 'us-gaap_SellingGeneralAndAdministrativeExpenses', 'us-gaap_GeneralAndAdministrativeExpense', 'ifrs-full_SellingGeneralAndAdministrativeExpense']));
            const rd = Math.abs(findConcept(ic, ['us-gaap_ResearchAndDevelopmentExpense', 'us-gaap_ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost']));
            if (gp2 > 0 && sga > 0) ebit = gp2 - sga - rd;
        }

        const da = findConcept(cf, ['us-gaap_DepreciationDepletionAndAmortization', 'us-gaap_DepreciationAmortizationAndAccretionNet', 'ifrs-full_DepreciationAndAmortisationExpense']);
        const ebitda = ebit + da;
        const ebitdaMargin = rev ? ebitda / rev : 0;
        const netIncome = findConcept(ic, ['us-gaap_NetIncomeLoss', 'ifrs-full_ProfitLoss']);
        const niMargin = rev ? netIncome / rev : 0;

        const shortTermDebt = findConcept(bs, ['us-gaap_LongTermDebtCurrent', 'us-gaap_ShortTermDebt', 'us-gaap_DebtCurrent', 'us-gaap_ShortTermBorrowings', 'ifrs-full_CurrentBorrowings']);
        const longTermDebt = findConcept(bs, ['us-gaap_LongTermDebtNoncurrent', 'us-gaap_LongTermDebt', 'ifrs-full_NoncurrentBorrowings']);
        const totalDebt = shortTermDebt + longTermDebt;
        const totalCash = findConcept(bs, ['us-gaap_CashAndCashEquivalentsAtCarryingValue', 'us-gaap_CashAndCashEquivalentsAtCarryingValueIncludingVariableInterestEntities', 'ifrs-full_CashAndCashEquivalents']);
        const totalEquity = findConcept(bs, ['us-gaap_StockholdersEquity', 'us-gaap_StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', 'ifrs-full_Equity']);

        const cfo = findConcept(cf, ['us-gaap_NetCashProvidedByUsedInOperatingActivities', 'ifrs-full_CashFlowsFromUsedInOperatingActivities']);
        const capex = Math.abs(findConcept(cf, ['us-gaap_PaymentsToAcquirePropertyPlantAndEquipment', 'ifrs-full_PurchaseOfPropertyPlantAndEquipment']));
        const fcf = cfo - capex;

        const histEvEbitda = financials.slice(0, 3).map((r: any) => {
            const rIc = r.report?.ic ?? [];
            const rCf = r.report?.cf ?? [];
            let rEbit = findConcept(rIc, ['us-gaap_OperatingIncomeLoss', 'ifrs-full_ProfitLossFromOperatingActivities']);
            if (!rEbit) {
                const rEbt = findConcept(rIc, ['us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest', 'ifrs-full_ProfitLossBeforeTax']);
                const rIntExp = Math.abs(findConcept(rIc, ['us-gaap_InterestExpense', 'us-gaap_InterestAndDebtExpense', 'ifrs-full_FinanceCosts']));
                const rIntInc = Math.abs(findConcept(rIc, ['us-gaap_InvestmentIncomeInterest', 'ifrs-full_FinanceIncome']));
                if (rEbt) rEbit = rEbt + rIntExp - rIntInc;
            }
            const rDa = findConcept(rCf, ['us-gaap_DepreciationDepletionAndAmortization', 'us-gaap_DepreciationAmortizationAndAccretionNet', 'ifrs-full_DepreciationAndAmortisationExpense']);
            const rEbitda = rEbit + rDa;
            return { year: r.endDate?.substring(0, 4) ?? String(r.year), evEbitda: rEbitda > 0 ? (marketCap + totalDebt - totalCash) / rEbitda : null };
        }).reverse();

        const ev = marketCap + totalDebt - totalCash;
        const price = sharesOut ? marketCap / sharesOut : 0;
        const evToRev = rev ? ev / rev : 0;
        const evToEbitda = ebitda ? ev / ebitda : 0;
        const pToSales = rev ? marketCap / rev : 0;
        const pToE = netIncome > 0 ? marketCap / netIncome : 0;
        const pToBook = totalEquity > 0 ? marketCap / totalEquity : 0;
        const pToFCF = fcf > 0 ? marketCap / fcf : 0;

        const result: PeerData = {
            symbol: profile.ticker, name: profile.name, rev, revGrowth,
            ebitda, ebitdaMargin, netIncome, niMargin, price, marketCap, ev,
            evToRev, evToEbitda, pToSales, pToE, pToBook, pToFCF,
            totalDebt, totalCash, totalEquity, sharesOut, fcf, histEvEbitda,
        };

        safeSetItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: result }));
        return result;
    } catch { return null; }
}

/* ── usePeerData hook ──────────────────────────────────────────────────── */

export function usePeerData() {
    const [tickerInput, setTickerInput] = useState('');
    const [ticker, setTicker] = useState('');

    // Peer finder
    const [showPeerFinder, setShowPeerFinder] = useState(false);
    const [peerFinderLoading, setPeerFinderLoading] = useState(false);
    const [peerSuggestions, setPeerSuggestions] = useState<PeerSuggestion[]>([]);

    // User-selected peers (max 5)
    const [selectedPeerSymbols, setSelectedPeerSymbols] = useState<string[]>([]);
    const [customPeerInput, setCustomPeerInput] = useState('');

    // Analysis results
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<PeerData[]>([]);
    const [selectedPeers, setSelectedPeers] = useState<Record<string, boolean>>({});
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

    /* ── Handlers ──────────────────────────────────────────────────────── */

    const handleLegendClick = (d: any, chartKeys: string[]) => {
        setHiddenSeries(prev => {
            const allOthersHidden = chartKeys.every(k => k === d.dataKey || prev[k]);
            if (allOthersHidden) {
                const next = { ...prev };
                chartKeys.forEach(k => { next[k] = false; });
                return next;
            }
            const next = { ...prev };
            chartKeys.forEach(k => { next[k] = k !== d.dataKey; });
            return next;
        });
    };

    const toggleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const fetchPeerSuggestions = async (sym: string) => {
        setPeerFinderLoading(true);
        setShowPeerFinder(true);
        setPeerSuggestions([]);
        try {
            const res = await proxyFetch(`${BASE_URL}/stock/peers?symbol=${sym}&grouping=subindustry`);
            if (!res.ok) return;
            const list: string[] = await res.json();
            const candidates = list.filter(p => p !== sym).slice(0, 10);
            const profiles = await Promise.all(
                candidates.map(p =>
                    proxyFetch(`${BASE_URL}/stock/profile2?symbol=${p}`)
                        .then(r => r.ok ? r.json() : null)
                        .catch(() => null)
                )
            );
            setPeerSuggestions(
                candidates
                    .map((p, i) => ({ symbol: p, name: profiles[i]?.name ?? p, isUS: profiles[i]?.country === 'US' }))
                    .filter(s => s.name && s.name !== s.symbol)
            );
        } catch { /* silent */ } finally { setPeerFinderLoading(false); }
    };

    const togglePeerSelection = (sym: string) => {
        setSelectedPeerSymbols(prev => {
            if (prev.includes(sym)) return prev.filter(s => s !== sym);
            if (prev.length >= 5) return prev;
            return [...prev, sym];
        });
    };

    const addCustomPeer = (e: React.FormEvent) => {
        e.preventDefault();
        const sym = customPeerInput.trim().toUpperCase();
        if (!sym || selectedPeerSymbols.includes(sym) || sym === ticker || selectedPeerSymbols.length >= 5) return;
        setSelectedPeerSymbols(prev => [...prev, sym]);
        setCustomPeerInput('');
    };

    const removePeer = (sym: string) =>
        setSelectedPeerSymbols(prev => prev.filter(s => s !== sym));

    const clearAllPeers = () => setSelectedPeerSymbols([]);

    const fetchData = async () => {
        const sym = tickerInput.trim().toUpperCase();
        if (!sym) return;
        setLoading(true);
        setError('');
        const confirmedTicker = sym;
        setTicker(confirmedTicker);
        try {
            const targetData = await fetchStockData(confirmedTicker);
            if (!targetData) throw new Error(`No financial data found for ${confirmedTicker}. Only US-listed stocks with SEC filings (NYSE / NASDAQ) are supported.`);

            const initialSelected: Record<string, boolean> = {};
            const peerResults: PeerData[] = [];
            for (const peer of selectedPeerSymbols) {
                if (peer === confirmedTicker) continue;
                const d = await fetchStockData(peer);
                if (d) { peerResults.push(d); initialSelected[peer] = true; }
            }

            setData([targetData, ...peerResults]);
            setSelectedPeers(initialSelected);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally { setLoading(false); }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const sym = tickerInput.trim().toUpperCase();
        if (!sym) return;
        setTicker(sym);
        setShowPeerFinder(false);
        setPeerSuggestions([]);
        setSelectedPeerSymbols([]);
        setData([]);
        setError('');
    };

    const togglePeer = (symbol: string) =>
        setSelectedPeers(prev => ({ ...prev, [symbol]: !prev[symbol] }));

    return {
        // State
        tickerInput, ticker, showPeerFinder, peerFinderLoading, peerSuggestions,
        selectedPeerSymbols, customPeerInput, loading, error, data, selectedPeers,
        sortKey, sortDir, hiddenSeries,
        // Setters
        setTickerInput, setCustomPeerInput,
        // Handlers
        handleLegendClick, toggleSort, fetchPeerSuggestions, togglePeerSelection,
        addCustomPeer, removePeer, clearAllPeers, fetchData, handleSearch, togglePeer,
    };
}
