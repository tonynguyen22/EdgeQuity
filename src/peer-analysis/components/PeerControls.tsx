/* ── PeerControls — Search, Peer Finder, Selected Tags ────────────────── */

import React, { useState, useMemo } from 'react';
import { Search, Users, Plus, X, Database, Info } from 'lucide-react';
import type { PeerSuggestion } from '../types';
import { SUPPORTED_TICKERS } from '../../dcf/types';
import SupportedTickersBySector from '../../components/SupportedTickersBySector';

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
    // Whether we have analysis data already
    hasData: boolean;
    // Current confirmed ticker
    ticker: string;
}

export default function PeerControls({
    tickerInput, onTickerInputChange, onSearch,
    showPeerFinder, peerFinderLoading, peerSuggestions, onFetchPeerSuggestions,
    selectedPeerSymbols, onTogglePeerSelection, onRemovePeer, onClearAllPeers,
    customPeerInput, onCustomPeerInputChange, onAddCustomPeer,
    loading, onRunAnalysis, showAbout, error, hasData, ticker,
}: PeerControlsProps) {
    const [showDropdown, setShowDropdown] = useState(false);

    const filteredTickers = useMemo(() => {
        const q = tickerInput.trim().toUpperCase();
        if (!q) return [...SUPPORTED_TICKERS];
        return SUPPORTED_TICKERS.filter(t => t.includes(q));
    }, [tickerInput]);

    const isValid = tickerInput.trim() && (SUPPORTED_TICKERS as readonly string[]).includes(tickerInput.trim().toUpperCase());
    const isCustomValid = customPeerInput.trim().length > 0;

    /** Dropdown click only populates input — does NOT trigger submit */
    const handleSelectTicker = (sym: string) => {
        onTickerInputChange(sym);
        setShowDropdown(false);
    };

    return (
        <>
            {/* ── Controls ──────────────────────────────────────────────────── */}
            <div className="space-y-5">

                {/* Row 1: ticker search (DCF-style centered) + action buttons */}
                <form onSubmit={onSearch} className="relative w-full max-w-xl mx-auto">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--vw-text-tertiary)' }} />
                    <input
                        type="text"
                        value={tickerInput}
                        onChange={e => { onTickerInputChange(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        placeholder="Search supported tickers (e.g. AAPL, MSFT)"
                        className="w-full rounded-xl pl-12 pr-52 py-4 text-base focus:outline-none uppercase transition-all"
                        style={{
                            background: 'var(--vw-bg-raised)',
                            border: '1px solid var(--vw-border-lit)',
                            color: 'var(--vw-text-primary)',
                            boxShadow: '0 0 30px -6px rgba(0, 212, 170, 0.15), 0 8px 24px -8px rgba(0,0,0,0.5)',
                        }}
                        autoComplete="off"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                        <button
                            type="button"
                            disabled={!isValid || peerFinderLoading}
                            onClick={() => onFetchPeerSuggestions(tickerInput.trim().toUpperCase())}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'var(--vw-bg-hover)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-primary)' }}
                        >
                            <Users className="w-3.5 h-3.5" />
                            {peerFinderLoading ? 'Finding…' : 'Peers'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className="text-white px-4 py-2 rounded-lg font-medium text-[13px] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            style={{ background: 'linear-gradient(135deg, #00d4aa, #00a88a)' }}
                        >
                            {loading ? 'Loading…' : 'Analyze'}
                        </button>
                    </div>

                    {showDropdown && (
                        <div className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-2xl max-h-48 overflow-y-auto"
                            style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)' }}
                        >
                            {filteredTickers.length > 0 ? (
                                filteredTickers.slice(0, 20).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onMouseDown={() => handleSelectTicker(t)}
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

                {/* Peers required guidance — show when ticker is set but no data yet */}
                {ticker && !hasData && !loading && selectedPeerSymbols.length === 0 && !showPeerFinder && (
                    <div className="w-full max-w-xl mx-auto rounded-xl overflow-hidden" style={{ border: '1px solid var(--vw-border)' }}>
                        <table className="w-full text-sm" style={{ background: 'var(--vw-bg-raised)' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--vw-border)' }}>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--vw-text-tertiary)', background: 'var(--vw-bg-surface)' }}>
                                        Step
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--vw-text-tertiary)', background: 'var(--vw-bg-surface)' }}>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--vw-border-dim)' }}>
                                    <td className="px-4 py-3" style={{ color: 'var(--vw-accent)' }}>
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: 'var(--vw-accent-soft)' }}>1</span>
                                    </td>
                                    <td className="px-4 py-3" style={{ color: 'var(--vw-text-secondary)' }}>
                                        Click <strong style={{ color: 'var(--vw-text-primary)' }}>Peers</strong> to auto-discover peers, or add them manually below
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--vw-border-dim)' }}>
                                    <td className="px-4 py-3" style={{ color: 'var(--vw-accent)' }}>
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: 'var(--vw-accent-soft)' }}>2</span>
                                    </td>
                                    <td className="px-4 py-3" style={{ color: 'var(--vw-text-secondary)' }}>
                                        Select up to <strong style={{ color: 'var(--vw-text-primary)' }}>5 peers</strong> to compare against <strong style={{ color: 'var(--vw-accent)' }}>{ticker}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3" style={{ color: 'var(--vw-accent)' }}>
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: 'var(--vw-accent-soft)' }}>3</span>
                                    </td>
                                    <td className="px-4 py-3" style={{ color: 'var(--vw-text-secondary)' }}>
                                        Click <strong style={{ color: 'var(--vw-text-primary)' }}>Analyze</strong> to run the full peer comparison
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Row 2: Peer Finder suggestions panel */}
                {showPeerFinder && (
                    <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--vw-accent-soft)' }}>
                                    <Users className="w-4 h-4" style={{ color: 'var(--vw-accent)' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>Suggested Peers</p>
                                    <p className="text-xs" style={{ color: 'var(--vw-text-tertiary)' }}>Click to add · max 5</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: 'rgba(56, 189, 248, 0.08)', color: 'var(--vw-blue)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                                    <Database className="w-3 h-3" />
                                    Finnhub data
                                </span>
                                <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--vw-text-secondary)' }}>{selectedPeerSymbols.length}<span style={{ color: 'var(--vw-text-muted)' }}>/5</span></span>
                            </div>
                        </div>

                        {peerFinderLoading ? (
                            <div className="flex items-center gap-2.5 text-sm py-3" style={{ color: 'var(--vw-text-secondary)' }}>
                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                Fetching peer list…
                            </div>
                        ) : peerSuggestions.length === 0 ? (
                            <p className="text-sm py-2" style={{ color: 'var(--vw-text-tertiary)' }}>No peer suggestions found for this ticker.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2.5">
                                {peerSuggestions.map(p => {
                                    const isSelected = selectedPeerSymbols.includes(p.symbol);
                                    const isFull = selectedPeerSymbols.length >= 5 && !isSelected;
                                    return (
                                        <button
                                            key={p.symbol}
                                            disabled={isFull}
                                            onClick={() => onTogglePeerSelection(p.symbol)}
                                            title={isFull ? 'Maximum 5 peers selected' : undefined}
                                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all ${isSelected
                                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                                    : isFull
                                                        ? 'bg-slate-800/40 border-slate-700/30 text-slate-600 cursor-not-allowed'
                                                        : 'hover:border-slate-500 hover:text-slate-100'
                                                }`}
                                            style={!isSelected && !isFull ? { background: 'var(--vw-bg-hover)', borderColor: 'var(--vw-border-lit)', color: 'var(--vw-text-secondary)' } : undefined}
                                        >
                                            <span className="font-bold" style={{ color: isSelected ? undefined : 'var(--vw-text-primary)' }}>{p.symbol}</span>
                                            <span className="max-w-[120px] truncate" style={{ color: isSelected ? undefined : 'var(--vw-text-tertiary)' }}>{p.name}</span>
                                            <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.isUS ? 'bg-blue-500/15 text-blue-300' : 'bg-amber-500/15 text-amber-300'
                                                }`}>
                                                {p.isUS ? 'US' : 'Non-US'}
                                            </span>
                                            {isSelected && <X className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Note about data source */}
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--vw-text-muted)' }}>
                            Peer suggestions are sourced from Finnhub and may include tickers outside the supported pool. Data availability may vary.
                        </p>

                        {/* Manual custom peer input */}
                        <form onSubmit={onAddCustomPeer} className="flex items-center gap-2.5 pt-3" style={{ borderTop: '1px solid var(--vw-border)' }}>
                            <div className="flex items-center gap-1.5 text-[13px] shrink-0 font-medium" style={{ color: 'var(--vw-text-tertiary)' }}>
                                <Plus className="w-4 h-4" />
                                Add manually:
                            </div>
                            <input
                                type="text"
                                value={customPeerInput}
                                onChange={e => onCustomPeerInputChange(e.target.value)}
                                placeholder="Any ticker (e.g. TSLA)"
                                className="flex-1 max-w-[160px] px-3 py-1.5 rounded-lg text-[13px] uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                                style={{ background: 'var(--vw-bg-surface)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-primary)' }}
                            />
                            <button
                                type="submit"
                                disabled={selectedPeerSymbols.length >= 5 || !isCustomValid}
                                className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: 'var(--vw-bg-hover)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-primary)' }}
                            >
                                Add
                            </button>
                        </form>
                    </div>
                )}

                {/* Row 3: Selected peers tags */}
                {selectedPeerSymbols.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase font-semibold tracking-wide" style={{ color: 'var(--vw-text-tertiary)' }}>Peers selected:</span>
                        {selectedPeerSymbols.map(sym => (
                            <span key={sym} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--vw-bg-hover)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-primary)' }}>
                                {sym}
                                <button onClick={() => onRemovePeer(sym)} className="hover:text-red-400 transition-colors" style={{ color: 'var(--vw-text-tertiary)' }}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        <button onClick={onClearAllPeers} className="text-xs hover:text-red-400 transition-colors ml-1" style={{ color: 'var(--vw-text-tertiary)' }}>
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* ── About hint ────────────────────────────────────────────────── */}
            {showAbout && (
                <div className="w-full max-w-2xl mx-auto rounded-xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
                    <ul className="space-y-2.5">
                        {[
                            'Compares your chosen stock against up to 5 similar companies side by side',
                            'Uses 6 valuation methods (EV/Revenue, EV/EBITDA, P/E, P/Sales, P/Book, P/FCF)',
                            'Auto-suggests industry peers or lets you pick your own',
                            'Shows an implied price range using peer medians — a football-field valuation chart',
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
