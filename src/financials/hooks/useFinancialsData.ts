/* ── Financials — Data Fetching Hook ──────────────────────────────────── */

import { useState } from 'react';
import type { FinancialsResponse, StatementType } from '../types';
import { getCached, setCache } from '../utils/storage';

// Backend URL — set EDGAR_API_URL in .env for production (e.g. https://valu-wise.vercel.app)
const API_BASE = process.env.EDGAR_API_URL || 'http://localhost:3001';

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

            const res = await fetch(`${API_BASE}/api/financials?ticker=${sym}&years=5`);
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || `Failed to fetch financials (${res.status})`);
            }

            if (!json.income_statement?.length && !json.balance_sheet?.length && !json.cash_flow?.length) {
                throw new Error('No financial data found. Only US-listed stocks with SEC filings are supported.');
            }

            setData(json);
            setTicker(sym);
            setCache(sym, json);
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
