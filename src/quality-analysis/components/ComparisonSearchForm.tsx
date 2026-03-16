import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { SUPPORTED_TICKERS } from '../../dcf/types';
import SupportedTickersBySector from '../../components/SupportedTickersBySector';

interface ComparisonSearchFormProps {
    tickers: string[];
    loading: boolean;
    onAddTicker: (ticker: string) => void;
    onRemoveTicker: (ticker: string) => void;
}

export default function ComparisonSearchForm({ tickers, loading, onAddTicker, onRemoveTicker }: ComparisonSearchFormProps) {
    const [input, setInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const filteredTickers = useMemo(() => {
        const q = input.trim().toUpperCase();
        const available = SUPPORTED_TICKERS.filter(t => !tickers.includes(t));
        if (!q) return [...available];
        return available.filter(t => t.includes(q));
    }, [input, tickers]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (formRef.current && !formRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const sym = input.trim().toUpperCase();
        if (sym && (SUPPORTED_TICKERS as readonly string[]).includes(sym) && !tickers.includes(sym) && tickers.length < 2) {
            onAddTicker(sym);
            setInput('');
            setShowDropdown(false);
        }
    };

    const handleSelect = (ticker: string) => {
        setInput(ticker);
        setShowDropdown(false);
    };

    const isValid = input.trim() && (SUPPORTED_TICKERS as readonly string[]).includes(input.trim().toUpperCase()) && !tickers.includes(input.trim().toUpperCase());
    const isFull = tickers.length >= 2;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            {/* Hero Title */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--vw-text-primary)' }}>
                    Quality <span style={{ color: 'var(--vw-accent)' }}>Comparison</span>
                </h1>
                <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
                    Compare financial quality grades for up to 2 companies side by side
                </p>
            </div>

            {/* Selected Tickers */}
            {tickers.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                    {tickers.map(t => (
                        <div
                            key={t}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-semibold"
                            style={{
                                background: 'rgba(0, 212, 170, 0.12)',
                                border: '1px solid rgba(0, 212, 170, 0.3)',
                                color: 'var(--vw-accent)',
                            }}
                        >
                            {t}
                            <button
                                onClick={() => onRemoveTicker(t)}
                                className="hover:text-red-400 transition-colors"
                                style={{ color: 'var(--vw-text-tertiary)' }}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {tickers.length === 1 && (
                        <div
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
                            style={{ border: '1px dashed var(--vw-border-lit)', color: 'var(--vw-text-tertiary)' }}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add a 2nd ticker below
                        </div>
                    )}
                </div>
            )}

            {/* Search Box */}
            {!isFull && (
                <form onSubmit={handleSubmit} className="relative w-full max-w-xl" ref={formRef}>
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--vw-text-tertiary)' }} />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder={tickers.length === 0 ? 'Search a ticker to start (e.g. AAPL)' : 'Add a 2nd ticker to compare'}
                        className="w-full rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none uppercase transition-all"
                        style={{
                            background: 'var(--vw-bg-raised)',
                            border: '1px solid var(--vw-border-lit)',
                            color: 'var(--vw-text-primary)',
                            boxShadow: '0 0 30px -6px rgba(0, 212, 170, 0.15), 0 8px 24px -8px rgba(0,0,0,0.5)',
                        }}
                        autoComplete="off"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !isValid}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-5 py-2.5 rounded-lg font-medium transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed z-10"
                        style={{ background: 'linear-gradient(135deg, #00d4aa, #00a88a)' }}
                    >
                        {loading ? 'Loading...' : tickers.length === 0 ? 'Analyze' : 'Compare'}
                    </button>
                    {showDropdown && filteredTickers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50"
                            style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)' }}
                        >
                            {filteredTickers.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleSelect(t)}
                                    className="w-full text-left px-4 py-2.5 text-sm font-mono transition-colors first:rounded-t-xl last:rounded-b-xl"
                                    style={{ color: 'var(--vw-text-primary)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--vw-bg-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                    {showDropdown && filteredTickers.length === 0 && input.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl z-50 px-4 py-3 text-sm"
                            style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-tertiary)' }}
                        >
                            No matching ticker found.
                        </div>
                    )}
                </form>
            )}

            {/* About Section */}
            {tickers.length === 0 && (
                <div className="w-full max-w-2xl mt-8 rounded-xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
                    <ul className="space-y-2.5">
                        {[
                            "Compare up to 2 companies' financial quality side by side with letter grades (A–D)",
                            "See which company leads in profitability, balance sheet strength, growth, and cash flow quality",
                            "View overlaid radar charts and head-to-head metric comparisons",
                            "Compare risk profiles, Altman Z-Scores, and Piotroski F-Scores",
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
        </div>
    );
}
