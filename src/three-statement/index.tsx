import React, { useState, useMemo } from 'react';
import { Search, FileSpreadsheet, Download, AlertCircle, Info, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { buildForecast } from './calculations';
import { useStatementData } from './hooks/useStatementData';
import { exportThreeStatementToExcel } from './utils/excel';
import { SUPPORTED_TICKERS } from '../dcf/types';
import type { ThreeStmtInputs, ForecastRow } from './types';
import SupportedTickersBySector from '../components/SupportedTickersBySector';

type StatementView = 'income' | 'balance' | 'cashflow';

export default function ThreeStatement() {
  const [tickerInput, setTickerInput] = useState('');
  const [ticker, setTicker] = useState('');
  const [showForecast, setShowForecast] = useState(false);
  const [activeStmt, setActiveStmt] = useState<StatementView>('income');
  const [showDropdown, setShowDropdown] = useState(false);

  const [inputs, setInputs] = useState<ThreeStmtInputs>({
    revenueGrowths: [10, 9, 8, 7, 6],
    cogsPercent: 60,
    sgaPercent: 15,
    daPercent: 4,
    interestRate: 5,
    taxRate: 21,
    capexPercent: 5,
    dso: 45,
    dio: 60,
    dpo: 40,
    dividendPayout: 30,
    debtRepayment: 0,
    newDebt: 0,
    forecastYears: 5,
  });

  const { historicals, loading, error, companyName, fetchData, reset } = useStatementData();

  const filteredTickers = useMemo(() => {
    const q = tickerInput.trim().toUpperCase();
    if (!q) return [...SUPPORTED_TICKERS];
    return SUPPORTED_TICKERS.filter(t => t.includes(q));
  }, [tickerInput]);

  // Auto-fill assumptions from historicals
  React.useEffect(() => {
    if (historicals.length > 0) {
      const last = historicals[historicals.length - 1];
      const rev = last.revenue || 1;
      setInputs(prev => ({
        ...prev,
        cogsPercent: Math.round((last.cogs / rev) * 1000) / 10,
        sgaPercent: Math.round((last.sga / rev) * 1000) / 10,
        daPercent: Math.round((last.da / rev) * 1000) / 10,
        taxRate: last.ebt > 0 ? Math.round((last.tax / last.ebt) * 1000) / 10 : 21,
        capexPercent: Math.round((last.capex / rev) * 1000) / 10,
        dso: last.revenue > 0 ? Math.round((last.receivables / last.revenue) * 365) : 45,
        dio: last.cogs > 0 ? Math.round((last.inventory / last.cogs) * 365) : 60,
        dpo: last.cogs > 0 ? Math.round((last.payables / last.cogs) * 365) : 40,
        interestRate: last.totalDebt > 0 ? Math.round((last.interestExpense / last.totalDebt) * 1000) / 10 : 5,
      }));
    }
  }, [historicals]);

  const forecastData = useMemo((): ForecastRow[] => {
    if (!showForecast || historicals.length === 0) return [];
    return buildForecast(historicals, inputs);
  }, [showForecast, historicals, inputs]);

  const [showLoading, setShowLoading] = useState(false);
  const isLoading = loading || showLoading;

  /** Dropdown click only populates input — does NOT trigger fetch */
  const handleDropdownPick = (sym: string) => {
    setTickerInput(sym);
    setShowDropdown(false);
  };

  const handleSelectTicker = (sym: string) => {
    setTickerInput(sym);
    setTicker(sym);
    setShowDropdown(false);
    setShowForecast(false);
    setShowLoading(true);
    fetchData(sym);
    setTimeout(() => setShowLoading(false), 2500);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = tickerInput.trim().toUpperCase();
    if (sym && (SUPPORTED_TICKERS as readonly string[]).includes(sym)) {
      handleSelectTicker(sym);
    }
  };

  const handleGoBack = () => {
    reset();
    setTicker('');
    setTickerInput('');
    setShowForecast(false);
  };

  const handleRevenueGrowthChange = (idx: number, val: number) => {
    setInputs(prev => {
      const newGrowths = [...prev.revenueGrowths];
      newGrowths[idx] = val;
      return { ...prev, revenueGrowths: newGrowths };
    });
  };

  const fmt = (v: number, divisor = 1e6) => {
    const val = v / divisor;
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}B`;
    return `${val.toFixed(0)}M`;
  };

  const SliderInput = ({ label, value, onChange, min, max, step, suffix = '%' }: {
    label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix?: string;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400">{label}</label>
        <span className="text-xs font-mono text-slate-300">{value.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  );

  const StatementTable = ({ rows, fields }: { rows: ForecastRow[]; fields: { label: string; key: keyof ForecastRow; isPercent?: boolean; isBold?: boolean; isDivider?: boolean }[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr>
            <th className="text-left pb-3 pr-6 text-slate-500 font-medium sticky left-0 bg-[var(--vw-bg-surface)] z-10 min-w-[160px]">Line Item</th>
            {rows.map(r => (
              <th key={r.year} className={`pb-3 px-3 text-right min-w-[80px] ${r.isProjected ? 'text-cyan-400' : 'text-slate-400'}`}>
                {r.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map(({ label, key, isPercent, isBold, isDivider }) => (
            <tr key={label} className={`${isDivider ? 'border-t border-slate-700/50' : ''}`}>
              <td className={`py-1.5 pr-6 sticky left-0 bg-[var(--vw-bg-surface)] z-10 ${isBold ? 'text-slate-200 font-semibold' : 'text-slate-500'}`}>
                {label}
              </td>
              {rows.map(r => {
                const v = r[key] as number;
                return (
                  <td key={r.year} className={`py-1.5 px-3 text-right ${r.isProjected ? 'text-slate-200' : 'text-slate-400'} ${isBold ? 'font-semibold' : ''}`}>
                    {isPercent ? `${v.toFixed(1)}%` : fmt(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero title + search — shown when no ticker selected */}
      {!ticker && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--vw-text-primary)' }}>
              3-Statement Financial <span style={{ color: 'var(--vw-accent)' }}>Model</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
              Build a linked Income Statement, Balance Sheet, and Cash Flow forecast
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative w-full max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--vw-text-tertiary)' }} />
            <input
              type="text"
              value={tickerInput}
              onChange={e => { setTickerInput(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Search supported tickers (e.g. AAPL, MSFT)"
              className="w-full rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none uppercase transition-all"
              style={{
                background: 'var(--vw-bg-raised)',
                border: '1px solid var(--vw-border-lit)',
                color: 'var(--vw-text-primary)',
                boxShadow: '0 0 30px -6px rgba(0, 212, 170, 0.15), 0 8px 24px -8px rgba(0,0,0,0.5)',
              }}
              autoComplete="off"
            />
            <button type="submit" disabled={!tickerInput.trim() || !(SUPPORTED_TICKERS as readonly string[]).includes(tickerInput.trim().toUpperCase())}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all z-10"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #00a88a)' }}>
              Analyze
            </button>

            {showDropdown && (
              <div className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-2xl max-h-48 overflow-y-auto"
                style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)' }}
              >
                {filteredTickers.length > 0 ? (
                  filteredTickers.slice(0, 20).map(t => (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={() => handleDropdownPick(t)}
                      className="w-full text-left px-4 py-2.5 text-sm font-mono transition-colors first:rounded-t-xl last:rounded-b-xl"
                      style={{ color: 'var(--vw-text-primary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--vw-bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {t}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>
                    No matching ticker. Only {SUPPORTED_TICKERS.length} pre-selected stocks are supported.
                  </div>
                )}
              </div>
            )}
          </form>
          <div className="w-full max-w-2xl mt-8 rounded-xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
            <ul className="space-y-2.5">
              {[
                'Builds a linked Income Statement, Balance Sheet, and Cash Flow forecast',
                'Loads 5 years of historical financials as a starting point',
                'Lets you adjust revenue growth and margin assumptions to project future performance',
                'Changes cascade automatically between all three statements — just like a real financial model',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: 'rgba(0,212,170,0.12)', color: 'var(--vw-accent)' }}>
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <SupportedTickersBySector className="mt-4" />
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">Loading financial statements…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-500 font-medium">Error loading data</h3>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Assumption Form */}
      {historicals.length > 0 && !showForecast && !isLoading && (
        <div className="space-y-6">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-white">{ticker}</h2>
            <span className="text-sm text-slate-400">{companyName}</span>
            <span className="text-xs text-slate-600">{historicals.length} years of historical data loaded</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Growth */}
            <div className="vw-card rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                Revenue Growth (%)
              </h3>
              {inputs.revenueGrowths.map((g, i) => (
                <SliderInput key={i} label={`Year ${i + 1}`} value={g} onChange={v => handleRevenueGrowthChange(i, v)}
                  min={-20} max={40} step={0.5} />
              ))}
            </div>

            {/* Margins */}
            <div className="vw-card rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cost Structure</h3>
              <SliderInput label="COGS (% of Revenue)" value={inputs.cogsPercent} onChange={v => setInputs(p => ({ ...p, cogsPercent: v }))}
                min={10} max={95} step={0.5} />
              <SliderInput label="SG&A (% of Revenue)" value={inputs.sgaPercent} onChange={v => setInputs(p => ({ ...p, sgaPercent: v }))}
                min={0} max={40} step={0.5} />
              <SliderInput label="D&A (% of Revenue)" value={inputs.daPercent} onChange={v => setInputs(p => ({ ...p, daPercent: v }))}
                min={0} max={15} step={0.5} />
              <SliderInput label="Tax Rate" value={inputs.taxRate} onChange={v => setInputs(p => ({ ...p, taxRate: v }))}
                min={0} max={40} step={0.5} />
            </div>

            {/* BS & CF */}
            <div className="vw-card rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Balance Sheet & Cash Flow</h3>
              <SliderInput label="CapEx (% of Revenue)" value={inputs.capexPercent} onChange={v => setInputs(p => ({ ...p, capexPercent: v }))}
                min={0} max={20} step={0.5} />
              <SliderInput label="DSO (Days)" value={inputs.dso} onChange={v => setInputs(p => ({ ...p, dso: v }))}
                min={10} max={120} step={1} suffix=" days" />
              <SliderInput label="DIO (Days)" value={inputs.dio} onChange={v => setInputs(p => ({ ...p, dio: v }))}
                min={0} max={180} step={1} suffix=" days" />
              <SliderInput label="DPO (Days)" value={inputs.dpo} onChange={v => setInputs(p => ({ ...p, dpo: v }))}
                min={10} max={120} step={1} suffix=" days" />
              <SliderInput label="Dividend Payout (%)" value={inputs.dividendPayout} onChange={v => setInputs(p => ({ ...p, dividendPayout: v }))}
                min={0} max={80} step={1} />
              <SliderInput label="Interest Rate on Debt" value={inputs.interestRate} onChange={v => setInputs(p => ({ ...p, interestRate: v }))}
                min={0} max={12} step={0.25} />
            </div>
          </div>

          {/* Proceed */}
          <div className="flex justify-center gap-3">
            <button onClick={handleGoBack}
              className="px-6 py-3 rounded-xl text-sm font-medium border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all">
              Back
            </button>
            <button onClick={() => setShowForecast(true)}
              className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #00d4aa, #00a88a)',
                boxShadow: '0 0 24px -4px rgba(0, 212, 170, 0.4)',
              }}>
              Build Model
            </button>
          </div>
        </div>
      )}

      {/* Forecast Results */}
      {forecastData.length > 0 && showForecast && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold text-white">{ticker}</h2>
              <span className="text-sm text-slate-400">{companyName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => exportThreeStatementToExcel(forecastData, ticker)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#06b6d4',
                }}>
                <Download className="w-3.5 h-3.5" />
                Export Excel
              </button>
              <button onClick={handleGoBack} className="text-sm text-slate-500 hover:text-white transition-colors">
                New Search
              </button>
            </div>
          </div>

          {/* Statement Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--vw-bg-raised)' }}>
            {([
              { id: 'income' as StatementView, label: 'Income Statement' },
              { id: 'balance' as StatementView, label: 'Balance Sheet' },
              { id: 'cashflow' as StatementView, label: 'Cash Flow' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveStmt(tab.id)}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: activeStmt === tab.id ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                  color: activeStmt === tab.id ? '#06b6d4' : 'var(--vw-text-secondary)',
                  borderBottom: activeStmt === tab.id ? '2px solid #06b6d4' : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Income Statement */}
          {activeStmt === 'income' && (
            <div className="vw-card rounded-xl p-6">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Income Statement</h3>
              <StatementTable
                rows={forecastData}
                fields={[
                  { label: 'Revenue', key: 'revenue', isBold: true },
                  { label: 'Revenue Growth', key: 'revenueGrowth', isPercent: true },
                  { label: 'COGS', key: 'cogs' },
                  { label: 'Gross Profit', key: 'grossProfit', isBold: true, isDivider: true },
                  { label: 'Gross Margin', key: 'grossMargin', isPercent: true },
                  { label: 'SG&A', key: 'sga' },
                  { label: 'D&A', key: 'da' },
                  { label: 'EBIT', key: 'ebit', isBold: true, isDivider: true },
                  { label: 'EBIT Margin', key: 'ebitMargin', isPercent: true },
                  { label: 'Interest Expense', key: 'interestExpense' },
                  { label: 'EBT', key: 'ebt', isDivider: true },
                  { label: 'Tax', key: 'tax' },
                  { label: 'Net Income', key: 'netIncome', isBold: true, isDivider: true },
                  { label: 'Net Margin', key: 'netMargin', isPercent: true },
                ]}
              />
            </div>
          )}

          {/* Balance Sheet */}
          {activeStmt === 'balance' && (
            <div className="vw-card rounded-xl p-6">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Balance Sheet</h3>
              <StatementTable
                rows={forecastData}
                fields={[
                  { label: 'Cash', key: 'cash' },
                  { label: 'Receivables', key: 'receivables' },
                  { label: 'Inventory', key: 'inventory' },
                  { label: 'PP&E', key: 'ppe' },
                  { label: 'Total Assets', key: 'totalAssets', isBold: true, isDivider: true },
                  { label: 'Payables', key: 'payables' },
                  { label: 'Total Debt', key: 'totalDebt' },
                  { label: 'Total Equity', key: 'totalEquity', isBold: true, isDivider: true },
                ]}
              />
            </div>
          )}

          {/* Cash Flow */}
          {activeStmt === 'cashflow' && (
            <div className="vw-card rounded-xl p-6">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Cash Flow Statement</h3>
              <StatementTable
                rows={forecastData}
                fields={[
                  { label: 'Net Income', key: 'netIncome' },
                  { label: 'D&A (add back)', key: 'da' },
                  { label: 'WC Change', key: 'wcChange' },
                  { label: 'Cash from Operations', key: 'cfo', isBold: true, isDivider: true },
                  { label: 'CapEx', key: 'capex' },
                  { label: 'Cash from Investing', key: 'cfi', isDivider: true },
                  { label: 'Cash from Financing', key: 'cff', isDivider: true },
                  { label: 'Free Cash Flow', key: 'fcf', isBold: true, isDivider: true },
                ]}
              />
            </div>
          )}

          {/* Adjust */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowForecast(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-medium border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all">
              Adjust Assumptions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
