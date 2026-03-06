/* ── EdgarTools — Data Fetching Hook ──────────────────────────────────── */
/* Calls the Python Flask API hosted on Render */

import { useState } from 'react';
import type { FinancialsResponse, StatementType } from '../../financials/types';

// API base URL — set via Vite define in vite.config.ts
// Falls back to localhost:5000 for local Flask development
declare const process: { env: Record<string, string | undefined> };
const API_BASE = process.env.EDGARTOOLS_API_URL || 'http://localhost:5000';

const CACHE_PREFIX = 'edgartools_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCached<T>(symbol: string): T | null {
    const key = `${CACHE_PREFIX}${symbol}_v1`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
        const { timestamp, data } = JSON.parse(raw);
        if (Date.now() - timestamp < CACHE_TTL_MS) return data as T;
        localStorage.removeItem(key);
    } catch {
        localStorage.removeItem(key);
    }
    return null;
}

function setCache(symbol: string, data: unknown): void {
    const key = `${CACHE_PREFIX}${symbol}_v1`;
    try {
        localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch {
        // Evict on quota exceeded
        const prefixes = ['edgartools_', 'edgar_', 'finnhub_', 'valuwise_', 'tech_', 'earnings_', 'insider_', 'news_', 'dividend_', 'portfolio_'];
        const keys = Object.keys(localStorage).filter(k => prefixes.some(p => k.startsWith(p)));
        for (const k of keys) {
            localStorage.removeItem(k);
            try {
                localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
                return;
            } catch { continue; }
        }
    }
}

interface UseEdgarToolsDataResult {
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

export function useEdgarToolsData(): UseEdgarToolsDataResult {
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
            const cached = getCached<FinancialsResponse>(sym);
            if (cached) {
                setData(cached);
                setTicker(sym);
                return;
            }

            const res = await fetch(`${API_BASE}/api/financials?ticker=${encodeURIComponent(sym)}`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Server returned ${res.status}`);
            }

            const result: FinancialsResponse = await res.json();
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
        if (sym) fetchData(sym);
    };

    const reset = () => {
        setData(null);
        setTicker('');
        setError('');
        setTickerInput('');
        setActiveStatement('income');
    };

    return {
        tickerInput, setTickerInput, ticker, data,
        loading, error, activeStatement, setActiveStatement,
        handleSearch, reset,
    };
}
