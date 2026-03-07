/* ── PeerControls — Search, Peer Finder, Selected Tags ────────────────── */

import React from 'react';
import { Search, Users, Plus, X } from 'lucide-react';
import type { PeerSuggestion } from '../types';

interface PeerControlsProps {
    tickerInput: string;
    onTickerInputChange: (val: string) => void;
    onSearch: (e: React.FormEvent) => void;
    // Peer finder
    showPeerFinder: boolean;
    peerFinderLoading: boolean;
    peerSuggestions: PeerSuggestion[];
    onFetchPeerSuggestions: (sym: string) => void;
    // Selected peers
    selectedPeerSymbols: string[];
    onTogglePeerSelection: (sym: string) => void;
    onRemovePeer: (sym: string) => void;
    onClearAllPeers: () => void;
    // Custom peer input
    customPeerInput: string;
    onCustomPeerInputChange: (val: string) => void;
    onAddCustomPeer: (e: React.FormEvent) => void;
    // Run analysis
    loading: boolean;
    onRunAnalysis: () => void;
    // About hint
    showAbout: boolean;
    error: string;
}

export default function PeerControls({
    tickerInput, onTickerInputChange, onSearch,
    showPeerFinder, peerFinderLoading, peerSuggestions, onFetchPeerSuggestions,
    selectedPeerSymbols, onTogglePeerSelection, onRemovePeer, onClearAllPeers,
    customPeerInput, onCustomPeerInputChange, onAddCustomPeer,
    loading, onRunAnalysis, showAbout, error,
}: PeerControlsProps) {
    return (
        <>
            {/* ── Controls ──────────────────────────────────────────────────── */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-5">

                {/* Row 1: ticker input + action buttons */}
                <form onSubmit={onSearch} className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[180px] max-w-xs">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Target Ticker</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            <input
                                type="text"
                                value={tickerInput}
                                onChange={e => onTickerInputChange(e.target.value)}
                                placeholder="e.g. AAPL"
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={!tickerInput.trim() || peerFinderLoading}
                        onClick={() => onFetchPeerSuggestions(tickerInput.trim().toUpperCase())}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Users className="w-4 h-4" />
                        {peerFinderLoading ? 'Finding…' : 'Peer Finder'}
                    </button>

                    <button
                        type="button"
                        disabled={loading || !tickerInput.trim()}
                        onClick={onRunAnalysis}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Loading…' : 'Run Analysis'}
                    </button>
                </form>

                {/* Row 2: Peer Finder suggestions panel */}
                {showPeerFinder && (
                    <div className="border border-slate-700/60 rounded-xl p-4 space-y-3 bg-slate-900/40">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                Suggested Peers
                                <span className="text-xs text-slate-500 font-normal">— click to add (max 5)</span>
                            </p>
                            <span className="text-xs text-slate-500">{selectedPeerSymbols.length}/5 selected</span>
                        </div>

                        {peerFinderLoading ? (
                            <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                                <div className="w-4 h-4 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                                Fetching peer list…
                            </div>
                        ) : peerSuggestions.length === 0 ? (
                            <p className="text-xs text-slate-500 py-1">No peer suggestions found for this ticker.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {peerSuggestions.map(p => {
                                    const isSelected = selectedPeerSymbols.includes(p.symbol);
                                    const isFull = selectedPeerSymbols.length >= 5 && !isSelected;
                                    return (
                                        <button
                                            key={p.symbol}
                                            disabled={isFull}
                                            onClick={() => onTogglePeerSelection(p.symbol)}
                                            title={isFull ? 'Maximum 5 peers selected' : undefined}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${isSelected
                                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                                    : isFull
                                                        ? 'bg-slate-800/40 border-slate-700/30 text-slate-600 cursor-not-allowed'
                                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100'
                                                }`}
                                        >
                                            <span className="font-bold">{p.symbol}</span>
                                            <span className="text-slate-400 max-w-[100px] truncate">{p.name}</span>
                                            <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.isUS ? 'bg-blue-500/15 text-blue-300' : 'bg-amber-500/15 text-amber-300'
                                                }`}>
                                                {p.isUS ? 'US' : 'Non-US'}
                                            </span>
                                            {isSelected && <X className="w-3 h-3 text-emerald-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Manual custom peer input */}
                        <form onSubmit={onAddCustomPeer} className="flex gap-2 pt-1 border-t border-slate-700/40">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                                <Plus className="w-3.5 h-3.5" />
                                Add manually:
                            </div>
                            <input
                                type="text"
                                value={customPeerInput}
                                onChange={e => onCustomPeerInputChange(e.target.value)}
                                placeholder="e.g. TSLA"
                                className="flex-1 max-w-[120px] px-2.5 py-1 bg-slate-800 border border-slate-600 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                            />
                            <button
                                type="submit"
                                disabled={selectedPeerSymbols.length >= 5 || !customPeerInput.trim()}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Add
                            </button>
                        </form>
                    </div>
                )}

                {/* Row 3: Selected peers tags */}
                {selectedPeerSymbols.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Peers selected:</span>
                        {selectedPeerSymbols.map(sym => (
                            <span key={sym} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-200 border border-slate-600">
                                {sym}
                                <button onClick={() => onRemovePeer(sym)} className="text-slate-400 hover:text-red-400 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        <button onClick={onClearAllPeers} className="text-xs text-slate-500 hover:text-red-400 transition-colors ml-1">
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* ── About hint ────────────────────────────────────────────────── */}
            {showAbout && (
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-sm font-semibold text-slate-300">About Peer Analysis</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Benchmark your target company against up to 5 peers using EV/Revenue, EV/EBITDA, P/E, P/Sales, P/Book, and P/FCF. Only US-listed stocks with SEC filings are supported.
                    </p>
                    <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {[
                            'Enter a ticker and click Run Analysis to load the target stock alone.',
                            'Click Peer Finder to see Finnhub\'s suggested industry peers — each is labeled US or Non-US.',
                            'Select up to 5 peers to add. Non-US peers may have missing data.',
                            'Or type any ticker manually in the "Add manually" field inside the Peer Finder panel.',
                            'Click any column header to sort the comparison table ascending or descending.',
                            'The football-field chart shows the implied price range using peer medians across 6 valuation methods.',
                        ].map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs text-blue-400 font-semibold">{i + 1}</span>
                                <span className="leading-relaxed">{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {/* ── Error ─────────────────────────────────────────────────────── */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <h3 className="text-red-500 font-medium">Error loading data</h3>
                        <p className="text-red-400/80 text-sm mt-1">{error}</p>
                        <p className="text-slate-500 text-xs mt-2">If this keeps happening, click <span className="text-slate-300 font-medium">Clear Cache</span> at the bottom left and try again.</p>
                    </div>
                </div>
            )}
        </>
    );
}
