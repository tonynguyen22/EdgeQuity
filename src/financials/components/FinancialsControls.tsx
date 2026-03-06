/* ── Financials Controls — Search + Statement Selector ────────────────── */

import React from 'react';
import { Search, AlertCircle, Info, FileSpreadsheet } from 'lucide-react';
import type { StatementType } from '../types';

interface Props {
    tickerInput: string;
    onTickerInputChange: (v: string) => void;
    onSearch: (e: React.FormEvent) => void;
    activeStatement: StatementType;
    onStatementChange: (s: StatementType) => void;
    loading: boolean;
    error: string;
    hasData: boolean;
    companyName: string;
    ticker: string;
}

const STATEMENTS: { id: StatementType; label: string }[] = [
    { id: 'income', label: 'Income Statement' },
    { id: 'balance', label: 'Balance Sheet' },
    { id: 'cashflow', label: 'Cash Flow' },
];

export default function FinancialsControls({
    tickerInput, onTickerInputChange, onSearch,
    activeStatement, onStatementChange,
    loading, error, hasData, companyName, ticker,
}: Props) {
    return (
        <div className="space-y-5">
            {/* Search bar */}
            {!hasData && !loading && (
                <div className="max-w-2xl mx-auto py-8 space-y-5">
                    <form onSubmit={onSearch} className="relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={tickerInput}
                            onChange={(e) => onTickerInputChange(e.target.value)}
                            placeholder="Enter a stock ticker (e.g. AAPL, MSFT, TSLA)"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase transition-all shadow-xl"
                        />
                        <button
                            type="submit"
                            disabled={!tickerInput.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Fetch
                        </button>
                    </form>

                    {/* About box */}
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <FileSpreadsheet className="w-4 h-4 text-teal-500" />
                            <span className="text-sm font-semibold text-slate-300">SEC Financial Statements</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            View standardized financial statements directly from SEC EDGAR 10-K filings. Data is extracted using edgartools with full XBRL taxonomy resolution — no missing fields from label mismatches.
                        </p>
                        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {[
                                'Enter a ticker and press Fetch to retrieve financial statements from SEC EDGAR.',
                                'Income Statement, Balance Sheet, and Cash Flow Statement are displayed in separate tabs.',
                                'All data comes from official 10-K annual filings with standardized XBRL labels.',
                                'Year-over-year growth rates are computed automatically for key line items.',
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs text-teal-400 font-semibold">{i + 1}</span>
                                    <span className="leading-relaxed">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            )}

            {/* Loading spinner */}
            {loading && (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 animate-pulse">Fetching financial data from SEC EDGAR...</p>
                    <p className="text-xs text-slate-600">This may take a few seconds on first load</p>
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

            {/* Header + statement tabs (shown when data is loaded) */}
            {hasData && !loading && (
                <div className="space-y-4">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-xl font-bold text-white">{ticker}</h2>
                        {companyName && <span className="text-sm text-slate-400">{companyName}</span>}
                    </div>

                    {/* Statement type tabs */}
                    <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit">
                        {STATEMENTS.map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => onStatementChange(id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeStatement === id
                                        ? 'bg-teal-500/20 text-teal-400 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
