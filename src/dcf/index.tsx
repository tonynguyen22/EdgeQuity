import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ComposedChart } from 'recharts';
import { Search, TrendingUp, TrendingDown, Info, AlertCircle, Target } from 'lucide-react';

import PeerAnalysis from '../peer-analysis';

import QualityAnalysis from '../quality-analysis';
import TechAnalysis from '../tech-analysis';
import EarningsEstimates from '../EarningsEstimates';
import InsiderInstitutional from '../InsiderInstitutional';
import NewsSentiment from '../NewsSentiment';
import DividendAnalysis from '../DividendAnalysis';
import MultiplesAnalysis from '../multiples-analysis';

import { computeDCF } from './calculations';
import { useDCFData } from './hooks/useDCFData';
import { printDCF } from './utils/print';
import { exportToExcel } from './utils/excel';
import { formatCurrency, formatModelCurrency, formatModelNumber, formatPct } from './utils/formatters';
import { clearAllCache } from './utils/storage';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import AssumptionSliders from './components/AssumptionSliders';
import ForecastTable from './components/ForecastTable';
import HistoricalTables from './components/HistoricalTables';
import SupportedTickersBySector from '../components/SupportedTickersBySector';
import type { DCFInputs, DCFResult, TabId, FormatUnit, ScenarioComparison, BridgeItem, ScenarioType } from './types';
import { SUPPORTED_TICKERS } from './types';

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function buildScenarioPatch(dcf: DCFResult, scenario: Exclude<ScenarioType, 'custom'>): Pick<DCFInputs, 'revGrowthStart' | 'revGrowthEnd' | 'ebitMarginStart' | 'ebitMarginEnd' | 'waccAdj'> {
  const baseRevStart = round1(dcf.revCagr5yr * 100);
  const baseRevEnd = round1(dcf.revCagr3yr * 100);
  const baseMarginStart = round1(dcf.baseEbitMargin * 100);
  const baseMarginEnd = round1(Math.max(dcf.baseEbitMargin, dcf.maxEbitMargin5yr) * 100);

  if (scenario === 'base') {
    return {
      revGrowthStart: baseRevStart,
      revGrowthEnd: baseRevEnd,
      ebitMarginStart: baseMarginStart,
      ebitMarginEnd: baseMarginEnd,
      waccAdj: 0,
    };
  }

  if (scenario === 'bull') {
    return {
      revGrowthStart: round1(baseRevEnd >= 0 ? baseRevEnd * 1.25 : baseRevEnd * 0.75),
      revGrowthEnd: round1(baseRevEnd >= 0 ? Math.max(1, baseRevEnd * 0.75) : baseRevEnd * 0.5),
      ebitMarginStart: baseMarginStart,
      ebitMarginEnd: round1(baseMarginEnd >= 0 ? baseMarginEnd * 1.15 : baseMarginEnd * 0.85),
      waccAdj: -0.5,
    };
  }

  return {
    revGrowthStart: round1(baseRevStart >= 0 ? baseRevStart * 0.5 : baseRevStart * 1.5),
    revGrowthEnd: round1(baseRevEnd >= 0 ? Math.max(-5, baseRevEnd * 0.1) : Math.min(-5, baseRevEnd * 1.25)),
    ebitMarginStart: round1(baseMarginStart >= 0 ? baseMarginStart * 0.85 : baseMarginStart * 1.15),
    ebitMarginEnd: round1(baseMarginEnd >= 0 ? baseMarginEnd * 0.7 : baseMarginEnd * 1.3),
    waccAdj: 1.0,
  };
}

function buildAutoFillPatch(dcf: DCFResult): Partial<DCFInputs> {
  return {
    ...buildScenarioPatch(dcf, 'base'),
    dnaMarginProj: round1(dcf.avgDnaMargin5yr * 100),
    wcMarginProj: round1(dcf.avgNwcMargin5yr * 100),
    capexMarginProj: round1(dcf.avgCapexMargin5yr * 100),
    sharesGrowthProj: round1(dcf.sharesCagr5yr * 100),
  };
}

function matchesScenario(inputs: DCFInputs, patch: Pick<DCFInputs, 'revGrowthStart' | 'revGrowthEnd' | 'ebitMarginStart' | 'ebitMarginEnd' | 'waccAdj'>) {
  return inputs.revGrowthStart === patch.revGrowthStart &&
    inputs.revGrowthEnd === patch.revGrowthEnd &&
    inputs.ebitMarginStart === patch.ebitMarginStart &&
    inputs.ebitMarginEnd === patch.ebitMarginEnd &&
    inputs.waccAdj === patch.waccAdj;
}

export default function App() {
  // ── App shell state ────────────────────────────────────────────────────────
  const [appState, setAppState] = useState({
    tickerInput: '',
    ticker: '',
    showLanding: true,
    activeTab: 'dcf' as TabId,
    cacheCleared: false,
  });

  // ── DCF model inputs (12 sliders) ──────────────────────────────────────────
  const [dcfInputs, setDcfInputs] = useState<DCFInputs>({
    revGrowthStart: 5,
    revGrowthEnd: 5,
    ebitMarginStart: 10,
    ebitMarginEnd: 10,
    termGrowth: 2.5,
    waccAdj: 0,
    erp: 5.5,
    dnaMarginProj: 0,
    wcMarginProj: 0,
    capexMarginProj: 0,
    sharesGrowthProj: 0,
    forecastYears: 5,
  });

  // ── UI state ───────────────────────────────────────────────────────────────
  const [uiState, setUiState] = useState({
    formatUnit: 'B' as FormatUnit,
    hiddenSeries: {} as Record<string, boolean>,
  });

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data, loading, error, analystTarget, reset } = useDCFData(appState.ticker);

  // ── DCF calculation ────────────────────────────────────────────────────────
  const dcfState = useMemo(() => {
    if (!data) return null;
    try {
      return { dcf: computeDCF(data, dcfInputs), calcError: '' };
    } catch (err: any) {
      return { dcf: null, calcError: err?.message || 'Unable to build DCF model for this ticker.' };
    }
  }, [data, dcfInputs]);
  const dcf = dcfState?.dcf ?? null;
  const calcError = dcfState?.calcError ?? '';
  const displayError = error || calcError;
  const isAuthError = /401|unauthorized/i.test(displayError);

  // ── Auto-fill sliders when a new ticker loads ──────────────────────────────
  const lastTickerRef = useRef('');
  useEffect(() => {
    if (dcf && appState.ticker !== lastTickerRef.current) {
      setDcfInputs(prev => ({ ...prev, ...buildAutoFillPatch(dcf) }));
      lastTickerRef.current = appState.ticker;
    }
  }, [dcf, appState.ticker]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleInputChange = (patch: Partial<DCFInputs>) => {
    setDcfInputs(prev => ({ ...prev, ...patch }));
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLFormElement>(null);

  const filteredTickers = useMemo(() => {
    const q = appState.tickerInput.trim().toUpperCase();
    if (!q) return [...SUPPORTED_TICKERS];
    return SUPPORTED_TICKERS.filter(t => t.includes(q));
  }, [appState.tickerInput]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = appState.tickerInput.trim().toUpperCase();
    if (input && (SUPPORTED_TICKERS as readonly string[]).includes(input)) {
      setAppState(prev => ({ ...prev, ticker: input, tickerInput: input }));
      setShowDropdown(false);
    }
  };

  const handleTickerSelect = (ticker: string) => {
    setAppState(prev => ({ ...prev, ticker, tickerInput: ticker }));
    setShowDropdown(false);
  };

  const handleGoBack = () => {
    reset();
    setAppState(prev => ({ ...prev, ticker: '', tickerInput: '' }));
  };

  const handleTabChange = (tab: TabId) => {
    setAppState(prev => ({ ...prev, activeTab: tab, showLanding: false }));
  };

  const handleShowLanding = () => {
    setAppState(prev => ({ ...prev, showLanding: true }));
  };

  const handleClearCache = () => {
    clearAllCache();
    setAppState(prev => ({ ...prev, cacheCleared: true }));
    setTimeout(() => setAppState(prev => ({ ...prev, cacheCleared: false })), 2500);
  };

  const handleLegendClick = (e: any, chartKeys: string[]) => {
    setUiState(prev => {
      const hidden = prev.hiddenSeries;
      const allOthersHidden = chartKeys.every(k => k === e.dataKey || hidden[k]);
      if (allOthersHidden && !hidden[e.dataKey]) {
        const newHidden = { ...hidden };
        chartKeys.forEach(k => { newHidden[k] = false; });
        return { ...prev, hiddenSeries: newHidden };
      } else {
        const newHidden = { ...hidden };
        chartKeys.forEach(k => { newHidden[k] = k !== e.dataKey; });
        return { ...prev, hiddenSeries: newHidden };
      }
    });
  };

  // ── Scenario management ────────────────────────────────────────────────────
  const applyScenario = (s: 'bull' | 'base' | 'bear') => {
    if (!dcf) return;
    setDcfInputs(prev => ({ ...prev, ...buildScenarioPatch(dcf, s) }));
  };

  // ── Derived useMemos ───────────────────────────────────────────────────────
  const activeScenario = useMemo((): 'bull' | 'base' | 'bear' | 'custom' => {
    if (!dcf) return 'custom';
    if (matchesScenario(dcfInputs, buildScenarioPatch(dcf, 'base'))) return 'base';
    if (matchesScenario(dcfInputs, buildScenarioPatch(dcf, 'bull'))) return 'bull';
    if (matchesScenario(dcfInputs, buildScenarioPatch(dcf, 'bear'))) return 'bear';
    return 'custom';
  }, [dcf, dcfInputs]);

  const bridgeData = useMemo((): BridgeItem[] | null => {
    if (!dcf) return null;
    const pvFcff = dcf.projections.reduce((s: number, p: any) => s + p.discountedFcff, 0);
    const pvTv = dcf.projections.at(-1)?.discountedTv ?? 0;
    const div = uiState.formatUnit === 'B' ? 1e9 : 1e6;
    return [
      { label: 'PV of FCFs', value: +(pvFcff / div).toFixed(2), base: 0, type: 'add' },
      { label: 'PV of TV', value: +(pvTv / div).toFixed(2), base: +(pvFcff / div).toFixed(2), type: 'add' },
      { label: '= EV', value: +(dcf.ev / div).toFixed(2), base: 0, type: 'total' },
      { label: '+ Cash', value: +(dcf.totalCash / div).toFixed(2), base: +(dcf.ev / div).toFixed(2), type: 'add' },
      { label: '− Debt', value: +(dcf.totalDebt / div).toFixed(2), base: +((dcf.ev + dcf.totalCash - dcf.totalDebt) / div).toFixed(2), type: 'sub' },
      { label: '= Equity', value: +(dcf.equityValue / div).toFixed(2), base: 0, type: 'total' },
    ];
  }, [dcf, uiState.formatUnit]);

  const reverseDcf = useMemo(() => {
    if (!dcf || dcf.currentPrice <= 0 || dcf.terminalShares <= 0 || !dcf.fractionOfYear) return null;
    const pvFcff = dcf.projections.reduce((s: number, p: any) => s + p.discountedFcff, 0);
    const lastFcff = dcf.projections.at(-1)?.fcff ?? 0;
    if (lastFcff <= 0) return null;
    const tvDiscPer = dcf.fractionOfYear + (dcf.projections.length - 1);
    const targetPvTv = (dcf.currentPrice * dcf.terminalShares) - pvFcff - dcf.totalCash + dcf.totalDebt;
    if (targetPvTv <= 0) return null;
    let lo = -0.05, hi = dcf.wacc - 0.001;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (mid >= dcf.wacc) { hi = mid; continue; }
      const tv = lastFcff * (1 + mid) / (dcf.wacc - mid);
      const pvTv = tv / Math.pow(1 + dcf.wacc, tvDiscPer);
      if (pvTv < targetPvTv) lo = mid; else hi = mid;
    }
    return { impliedTermGrowth: (lo + hi) / 2 };
  }, [dcf]);

  const scenarioComparison = useMemo((): ScenarioComparison | null => {
    if (!dcf) return null;
    const {
      revGrowthStart, revGrowthEnd, ebitMarginStart, ebitMarginEnd,
      termGrowth, waccAdj, forecastYears,
      dnaMarginProj, wcMarginProj, capexMarginProj, sharesGrowthProj,
    } = dcfInputs;
    const computeScenarioDCF = (revGs: number, revGe: number, ebitMs: number, ebitMe: number, scenWaccAdj: number) => {
      const scenWacc = Math.max(Math.max(dcf.rawWacc, 0.06) + scenWaccAdj / 100, termGrowth / 100 + 0.02);
      let prevRev = dcf.baseRev, prevWc = dcf.baseWc, prevShares = dcf.sharesOut;
      let sumPvFcff = 0, lastFcff = 0, lastDisc = 0, lastShares = dcf.sharesOut;
      for (let i = 1; i <= forecastYears; i++) {
        const g = forecastYears <= 1 ? revGs : revGs + (revGe - revGs) * (i - 1) / (forecastYears - 1);
        const rev = prevRev * (1 + g / 100);
        const shares = prevShares * (1 + sharesGrowthProj / 100);
        const margin = forecastYears <= 1 ? ebitMs / 100 : (ebitMs + (ebitMe - ebitMs) * (i - 1) / (forecastYears - 1)) / 100;
        const ebit = rev * margin;
        const ebiat = ebit * (1 - dcf.avgTaxRate);
        const dna = rev * (dnaMarginProj / 100);
        const capex = rev * (capexMarginProj / 100);
        const wc = rev * (wcMarginProj / 100);
        const deltaWc = wc - prevWc;
        const fcff = ebiat + dna - capex - deltaWc;
        const discPeriod = i === 1 ? dcf.fractionOfYear * 0.5 : dcf.fractionOfYear + (i - 2) + 0.5;
        sumPvFcff += fcff / Math.pow(1 + scenWacc, discPeriod);
        if (i === forecastYears) { lastFcff = fcff; lastDisc = dcf.fractionOfYear + (i - 1); lastShares = shares; }
        prevRev = rev; prevWc = wc; prevShares = shares;
      }
      const tv = lastFcff * (1 + termGrowth / 100) / (scenWacc - termGrowth / 100);
      const pvTv = tv / Math.pow(1 + scenWacc, lastDisc);
      const ev = sumPvFcff + pvTv;
      const eq = ev + dcf.totalCash - dcf.totalDebt;
      const price = lastShares > 0 ? eq / lastShares : 0;
      return { price, upside: dcf.currentPrice > 0 ? (price - dcf.currentPrice) / dcf.currentPrice : 0, ev, equityValue: eq };
    };
    const bearRevS = round1(revGrowthStart * 0.7);
    const bearRevE = round1(revGrowthEnd * 0.5);
    const bearMarginS = round1(ebitMarginStart * 0.85);
    const bearMarginE = round1(ebitMarginEnd * 0.7);
    const bullRevS = round1(revGrowthStart * 1.3);
    const bullRevE = round1(revGrowthEnd * 1.2);
    const bullMarginS = round1(ebitMarginStart * 1.1);
    const bullMarginE = round1(ebitMarginEnd * 1.15);
    return {
      bear: computeScenarioDCF(bearRevS, bearRevE, bearMarginS, bearMarginE, waccAdj + 1.0),
      base: computeScenarioDCF(revGrowthStart, revGrowthEnd, ebitMarginStart, ebitMarginEnd, waccAdj),
      bull: computeScenarioDCF(bullRevS, bullRevE, bullMarginS, bullMarginE, waccAdj - 0.5),
    };
  }, [dcf, dcfInputs]);

  // ── Export callbacks ───────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!dcf || !data) return;
    printDCF({
      dcf,
      ticker: appState.ticker,
      profileName: data.profile?.name ?? appState.ticker,
      activeScenario,
      inputs: dcfInputs,
      formatUnit: uiState.formatUnit,
      scenarioComparison,
    });
  };

  const handleExport = () => {
    if (!data) return;
    exportToExcel(data, appState.ticker);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const { showLanding, activeTab, cacheCleared, ticker, tickerInput } = appState;
  const { formatUnit, hiddenSeries } = uiState;
  const { forecastYears, termGrowth } = dcfInputs;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500/30 flex">
      <Sidebar
        showLanding={showLanding}
        activeTab={activeTab}
        cacheCleared={cacheCleared}
        onShowLanding={handleShowLanding}
        onTabChange={handleTabChange}
        onClearCache={handleClearCache}
      />

      <div className="flex-1 min-w-0">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showLanding ? (
            <LandingPage onTabChange={handleTabChange} />
          ) : activeTab === 'comp' ? (
            <PeerAnalysis />
          ) : activeTab === 'grade' ? (
            <QualityAnalysis />
          ) : activeTab === 'multiples' ? (
            <MultiplesAnalysis />
          ) : activeTab === 'tech' ? (
            <TechAnalysis />
          ) : activeTab === 'earnings' ? (
            <EarningsEstimates />
          ) : activeTab === 'insider' ? (
            <InsiderInstitutional />
          ) : activeTab === 'news' ? (
            <NewsSentiment />
          ) : activeTab === 'dividend' ? (
            <DividendAnalysis />
          ) : (
            <>
              {(!data || displayError) && !loading && (
                <div className="max-w-2xl mx-auto py-8 space-y-5">
                  <form onSubmit={handleSearch} className="relative" ref={dropdownRef}>
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <input
                      type="text"
                      value={tickerInput}
                      onChange={(e) => {
                        setAppState(prev => ({ ...prev, tickerInput: e.target.value }));
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Search supported tickers (e.g. AAPL, MSFT, TSLA)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase transition-all shadow-xl"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={!tickerInput.trim() || !(SUPPORTED_TICKERS as readonly string[]).includes(tickerInput.trim().toUpperCase())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed z-10"
                    >
                      Analyze
                    </button>
                    {showDropdown && filteredTickers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50">
                        {filteredTickers.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleTickerSelect(t)}
                            className="w-full text-left px-4 py-2.5 text-sm font-mono hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl text-slate-200"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                    {showDropdown && filteredTickers.length === 0 && tickerInput.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 px-4 py-3 text-sm text-slate-500">
                        No matching ticker found. Only {SUPPORTED_TICKERS.length} pre-selected stocks are supported.
                      </div>
                    )}
                  </form>
                  <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-300">About the DCF Model</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Build a Discounted Cash Flow valuation from standardized financial statements (via Financial Modeling Prep). The model projects Free Cash Flow to the Firm (FCFF) using your growth and margin assumptions, discounts at WACC, and adds a Gordon Growth terminal value to arrive at an intrinsic price per share.
                    </p>
                    <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {[
                        'Select a ticker from the supported list and press Analyze to fetch historical financials.',
                        "The model pre-fills Revenue Growth and EBIT Margin from the company's historical CAGR.",
                        'Adjust sliders to reflect your own projections, or use Bear / Base / Bull presets.',
                        'The sensitivity table maps implied share price across WACC x terminal growth combinations.',
                        'Cells highlighted green indicate upside vs current price; ring marks the current assumptions.',
                        'Click Print / PDF to generate a clean, printer-friendly report with all key outputs.',
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs text-emerald-400 font-semibold">{i + 1}</span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                    <SupportedTickersBySector accentClassName="text-emerald-400" className="mt-2" />
                  </div>
                </div>
              )}
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 animate-pulse">Fetching financial data...</p>
                </div>
              ) : displayError ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-500 font-medium">{error ? 'Error loading data' : 'DCF model unavailable'}</h3>
                    <p className="text-red-400/80 text-sm mt-1">{displayError}</p>
                    <p className="text-slate-500 text-xs mt-2">
                      {error
                        ? (
                          <>
                            If this keeps happening, click <span className="text-slate-300 font-medium">Clear Cache</span> at the bottom left and try again.
                            {isAuthError && <> A 401 usually means your API key is missing or invalid in Netlify Environment Variables.</>}
                          </>
                        )
                        : <>This ticker has incomplete financial data from FMP. Try another company from the supported list.</>}
                    </p>
                  </div>
                </div>
              ) : dcf && data ? (
                <div className="space-y-6">
                  {dcf.warnings.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <h3 className="text-amber-300 font-medium">Best-effort DCF assumptions in use</h3>
                          <ul className="text-sm text-amber-100/80 list-disc pl-5 space-y-1">
                            {dcf.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  {data?.profile?.name && (
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-xl font-bold text-white">{ticker}</h2>
                      <span className="text-sm text-slate-400">{data.profile.name}</span>
                      {data.profile.finnhubIndustry && <span className="text-xs text-slate-600">{data.profile.finnhubIndustry}</span>}
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Controls & Assumptions */}
                    <div className="lg:col-span-4 space-y-6">
                      <AssumptionSliders
                        inputs={dcfInputs}
                        dcf={dcf}
                        activeScenario={activeScenario}
                        onInputChange={handleInputChange}
                        onApplyScenario={applyScenario}
                        onNewSearch={handleGoBack}
                      />
                    </div>

                    {/* Right Column: Output & Charts */}
                    <div className="lg:col-span-8 space-y-6">

                      {/* Top Metrics Row */}
                      <div className={`grid grid-cols-1 gap-4 ${analystTarget ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                          <div className="text-sm text-slate-400 mb-1">Intrinsic Value</div>
                          <div className="text-3xl font-light tracking-tight">${dcf.intrinsicValue.toFixed(2)}</div>
                          <div className="text-xs text-slate-600 mt-1">{activeScenario !== 'custom' ? activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1) + ' case' : 'Custom'}</div>
                        </div>

                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                          <div className="text-sm text-slate-400 mb-1">Current Price</div>
                          <div className="text-3xl font-light tracking-tight">${dcf.currentPrice.toFixed(2)}</div>
                        </div>

                        <div className={`bg-slate-800/50 border rounded-xl p-5 ${dcf.upside >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                          <div className="text-sm text-slate-400 mb-1">Upside / Downside</div>
                          <div className={`text-3xl font-light tracking-tight flex items-center gap-2 ${dcf.upside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {dcf.upside >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                            {formatPct(dcf.upside)}
                          </div>
                        </div>

                        {analystTarget && (
                          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <div className="text-sm text-slate-400 mb-1 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5" /> Analyst Target
                            </div>
                            <div className="text-3xl font-light tracking-tight">${analystTarget.mean.toFixed(2)}</div>
                            <div className="text-xs text-slate-500 mt-1">Range: ${analystTarget.low.toFixed(0)}–${analystTarget.high.toFixed(0)}</div>
                            <div className={`text-xs mt-1 font-medium ${dcf.currentPrice < analystTarget.mean ? 'text-emerald-400' : 'text-red-400'}`}>
                              {dcf.currentPrice > 0 ? `${dcf.currentPrice < analystTarget.mean ? '+' : ''}${((analystTarget.mean - dcf.currentPrice) / dcf.currentPrice * 100).toFixed(1)}% vs price` : ''}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reverse DCF insight */}
                      {reverseDcf && (
                        <div className={`border rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${reverseDcf.impliedTermGrowth < 0.02 ? 'bg-emerald-500/5 border-emerald-500/25' :
                          reverseDcf.impliedTermGrowth < 0.04 ? 'bg-amber-500/5 border-amber-500/25' :
                            'bg-red-500/5 border-red-500/25'}`}>
                          <div className="flex-1">
                            <div className="text-xs text-slate-500 mb-0.5">Market-Implied Terminal Growth</div>
                            <div className={`text-2xl font-light font-mono ${reverseDcf.impliedTermGrowth < 0.02 ? 'text-emerald-400' :
                              reverseDcf.impliedTermGrowth < 0.04 ? 'text-amber-400' : 'text-red-400'}`}>
                              {(reverseDcf.impliedTermGrowth * 100).toFixed(2)}%
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                            At ${dcf.currentPrice.toFixed(2)}/share, holding WACC at {formatPct(dcf.wacc)} and current revenue projections, the market prices in {(reverseDcf.impliedTermGrowth * 100).toFixed(2)}% long-run terminal growth.
                            {reverseDcf.impliedTermGrowth >= 0.04 ? ' This implies high long-term expectations.' : reverseDcf.impliedTermGrowth < 0 ? ' This implies the market expects long-run contraction.' : ''}
                          </p>
                        </div>
                      )}

                      {/* FCFF Chart */}
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-6">Projected Free Cash Flow (FCFF)</h3>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dcf.projections} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1e9).toFixed(0)}B`} />
                              <Tooltip
                                cursor={{ fill: '#334155', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                itemStyle={{ color: '#10b981' }}
                                formatter={(value: number) => [formatCurrency(value), 'FCFF']}
                              />
                              <ReferenceLine y={0} stroke="#475569" />
                              <Bar dataKey="fcff" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Historical Trend Charts */}
                      {dcf.historicalSummary.length >= 2 && (() => {
                        const histChart = dcf.historicalSummary.map((h: any) => ({
                          year: h.year.substring(0, 4),
                          rev: +(h.rev / (formatUnit === 'B' ? 1e9 : 1e6)).toFixed(2),
                          revGrowth: +(h.revGrowth * 100).toFixed(1),
                          grossMargin: +(h.grossMargin * 100).toFixed(1),
                          ebitMargin: +(h.ebitMargin * 100).toFixed(1),
                          ebitdaMargin: +(h.ebitdaMargin * 100).toFixed(1),
                          netMargin: +(h.netProfitMargin * 100).toFixed(1),
                        }));
                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                              <h3 className="text-sm font-medium text-slate-300 mb-4">Historical Revenue &amp; Growth</h3>
                              <ResponsiveContainer width="100%" height={200}>
                                <ComposedChart data={histChart} margin={{ top: 4, right: 30, left: 0, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                  <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                  <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v}${formatUnit}`} width={48} />
                                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} width={40} />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                    formatter={(v: number, name: string) => [name === 'Revenue' ? `$${v}${formatUnit}` : `${v}%`, name]}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                                  <Bar yAxisId="left" dataKey="rev" name="Revenue" fill="#34d399" opacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={48} />
                                  <Line yAxisId="right" dataKey="revGrowth" name="Rev Growth %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} type="monotone" />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                              <h3 className="text-sm font-medium text-slate-300 mb-4">Historical Margin Trends</h3>
                              <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={histChart} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                  <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} width={40} />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                    formatter={(v: number, name: string) => [`${v}%`, name]}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }} onClick={(d: any) => handleLegendClick(d, ['grossMargin', 'ebitdaMargin', 'ebitMargin', 'netMargin'])} />
                                  <ReferenceLine y={0} stroke="#475569" />
                                  <Line type="monotone" dataKey="grossMargin" name="Gross" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['grossMargin']} />
                                  <Line type="monotone" dataKey="ebitdaMargin" name="EBITDA" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['ebitdaMargin']} />
                                  <Line type="monotone" dataKey="ebitMargin" name="EBIT" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['ebitMargin']} />
                                  <Line type="monotone" dataKey="netMargin" name="Net" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} hide={!!hiddenSeries['netMargin']} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Valuation Summary */}
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-4">Valuation Summary</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Enterprise Value</div>
                            <div className="font-mono text-sm">{formatCurrency(dcf.ev)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Total Cash</div>
                            <div className="font-mono text-sm">{formatCurrency(dcf.totalCash)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Total Debt</div>
                            <div className="font-mono text-sm">{formatCurrency(dcf.totalDebt)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Equity Value</div>
                            <div className="font-mono text-sm text-emerald-400">{formatCurrency(dcf.equityValue)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Valuation Bridge Chart */}
                      {bridgeData && (() => {
                        const unit = formatUnit;
                        return (
                          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-4">Valuation Bridge (${unit})</h3>
                            <div className="space-y-2">
                              {bridgeData.map(item => {
                                const isTotal = item.type === 'total';
                                const isSub = item.type === 'sub';
                                const color = isTotal ? 'bg-blue-500' : isSub ? 'bg-red-500' : 'bg-emerald-500';
                                const textCol = isTotal ? 'text-blue-400' : isSub ? 'text-red-400' : 'text-emerald-400';
                                const maxVal = Math.max(...bridgeData.filter(d => d.type === 'total').map(d => Math.abs(d.value)), 1);
                                const pct = Math.min(Math.abs(item.value) / maxVal * 100, 100);
                                return (
                                  <div key={item.label} className={`flex items-center gap-3 ${isTotal ? 'mt-3 pt-3 border-t border-slate-700/50' : ''}`}>
                                    <div className={`text-xs w-20 flex-shrink-0 text-right font-mono ${isTotal ? 'text-slate-300 font-semibold' : 'text-slate-500'}`}>{item.label}</div>
                                    <div className="flex-1 relative h-5 bg-slate-700/40 rounded overflow-hidden">
                                      <div className={`absolute inset-y-0 left-0 ${color} opacity-80 rounded transition-all duration-500`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className={`text-xs font-mono w-20 flex-shrink-0 ${textCol}`}>
                                      {isSub ? '-' : ''}${Math.abs(item.value).toFixed(1)}{unit}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-slate-600 mt-3">PV of FCFs + PV of Terminal Value = Enterprise Value → +Cash −Debt = Equity Value</p>
                          </div>
                        );
                      })()}

                      {/* Sensitivity Analysis Table */}
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 overflow-x-auto">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium">Sensitivity Analysis</h3>
                          <p className="text-xs text-slate-500 mt-1">Implied price per share — rows: terminal growth rate, columns: WACC</p>
                        </div>
                        <table className="w-full text-sm font-mono text-center">
                          <thead>
                            <tr>
                              <th className="text-left text-xs text-slate-500 pb-3 pr-4">g \ WACC</th>
                              {dcf.waccSteps.map((w: number) => (
                                <th key={w} className={`pb-3 px-3 text-xs font-medium ${Math.abs(w - dcf.wacc) < 0.0001 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  {(w * 100).toFixed(1)}%
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dcf.sensitivityMatrix.map((row: (number | null)[], ri: number) => {
                              const g = dcf.growthSteps[ri];
                              const isCurrentG = Math.abs(g - termGrowth / 100) < 0.0001;
                              return (
                                <tr key={ri} className="border-t border-slate-700/30">
                                  <td className={`text-left py-2.5 pr-4 text-xs ${isCurrentG ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                                    {(g * 100).toFixed(1)}%
                                  </td>
                                  {row.map((iv: number | null, ci: number) => {
                                    const w = dcf.waccSteps[ci];
                                    const isCurrentCell = isCurrentG && Math.abs(w - dcf.wacc) < 0.0001;
                                    const pct = iv !== null && dcf.currentPrice > 0 ? (iv - dcf.currentPrice) / dcf.currentPrice : null;
                                    const aboveAnalyst = iv !== null && analystTarget && iv >= analystTarget.mean;
                                    const bg = iv === null ? '' : pct !== null && pct >= 0.10 ? 'bg-emerald-500/25' : pct !== null && pct >= 0 ? 'bg-emerald-500/10' : pct !== null && pct >= -0.10 ? 'bg-red-500/10' : 'bg-red-500/25';
                                    const textColor = iv === null ? 'text-slate-600' : pct !== null && pct >= 0 ? 'text-emerald-400' : 'text-red-400';
                                    return (
                                      <td key={ci} className={`py-2.5 px-3 rounded ${bg} ${textColor} ${isCurrentCell ? 'ring-2 ring-emerald-500' : ''} ${aboveAnalyst && !isCurrentCell ? 'ring-1 ring-blue-400/50' : ''}`}>
                                        {iv === null ? '—' : `$${iv.toFixed(0)}`}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-600">
                          <span>Current price: ${dcf.currentPrice.toFixed(2)}</span>
                          {analystTarget && <span className="text-blue-400/70">Analyst target: ${analystTarget.mean.toFixed(0)} (range ${analystTarget.low.toFixed(0)}–${analystTarget.high.toFixed(0)})</span>}
                          <span>Green = upside · Red = downside · Ring = current assumptions{analystTarget ? ' · Blue outline = at/above analyst target' : ''}</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Scenario Comparison */}
                  {scenarioComparison && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                      <h3 className="text-sm font-medium text-slate-300 mb-4">Scenario Comparison</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {([
                          { key: 'bear', label: 'Bear Case', color: 'border-red-500/30 bg-red-500/5', textColor: 'text-red-400', desc: `Rev ${round1(dcfInputs.revGrowthStart * 0.7)}%→${round1(dcfInputs.revGrowthEnd * 0.5)}%, Margin ×0.85→0.70, WACC +1%` },
                          { key: 'base', label: 'Base Case', color: 'border-slate-500/30 bg-slate-700/20', textColor: 'text-slate-300', desc: `Rev ${dcfInputs.revGrowthStart}%→${dcfInputs.revGrowthEnd}%, Margin ${dcfInputs.ebitMarginStart}%→${dcfInputs.ebitMarginEnd}%` },
                          { key: 'bull', label: 'Bull Case', color: 'border-emerald-500/30 bg-emerald-500/5', textColor: 'text-emerald-400', desc: `Rev ${round1(dcfInputs.revGrowthStart * 1.3)}%→${round1(dcfInputs.revGrowthEnd * 1.2)}%, Margin ×1.1→1.15, WACC -0.5%` },
                        ] as const).map(({ key, label, color, textColor, desc }) => {
                          const s = scenarioComparison[key];
                          return (
                            <div key={key} className={`rounded-xl border p-4 space-y-2 ${color}`}>
                              <div className="text-xs text-slate-500 font-medium">{label}</div>
                              <div className={`text-3xl font-light font-mono ${textColor}`}>${s.price.toFixed(2)}</div>
                              <div className={`text-sm font-medium ${s.upside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {s.upside >= 0 ? '+' : ''}{(s.upside * 100).toFixed(1)}% vs ${dcf.currentPrice.toFixed(2)}
                              </div>
                              <div className="text-xs text-slate-600 leading-relaxed">{desc}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-5 space-y-2">
                        {(['bear', 'base', 'bull'] as const).map(key => {
                          const s = scenarioComparison[key];
                          const labels = { bear: 'Bear', base: 'Base', bull: 'Bull' };
                          const colors = { bear: 'bg-red-500', base: 'bg-slate-500', bull: 'bg-emerald-500' };
                          const maxPrice = Math.max(scenarioComparison.bull.price, dcf.currentPrice) * 1.05;
                          const pct = Math.min(s.price / maxPrice * 100, 100);
                          const curPct = Math.min(dcf.currentPrice / maxPrice * 100, 100);
                          return (
                            <div key={key} className="flex items-center gap-3">
                              <div className="text-xs text-slate-500 w-10 flex-shrink-0">{labels[key]}</div>
                              <div className="flex-1 relative h-4 bg-slate-700/40 rounded overflow-visible">
                                <div className={`absolute inset-y-0 left-0 ${colors[key]} rounded opacity-70`} style={{ width: `${pct}%` }} />
                                <div className="absolute inset-y-0 w-px bg-slate-300 opacity-60" style={{ left: `${curPct}%` }} />
                              </div>
                              <div className="text-xs font-mono text-slate-400 w-16 flex-shrink-0">${s.price.toFixed(0)}</div>
                            </div>
                          );
                        })}
                        <div className="text-xs text-slate-600 pl-14">Vertical line = current price (${dcf.currentPrice.toFixed(2)})</div>
                      </div>
                    </div>
                  )}

                  <ForecastTable
                    dcf={dcf}
                    formatUnit={formatUnit}
                    forecastYears={forecastYears}
                    onFormatUnitChange={(unit) => setUiState(prev => ({ ...prev, formatUnit: unit }))}
                    onPrint={handlePrint}
                    onExport={handleExport}
                  />

                  <HistoricalTables dcf={dcf} formatUnit={formatUnit} />
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
