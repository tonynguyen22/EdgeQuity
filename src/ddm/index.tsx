import React, { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { computeDDM, computeDDMSensitivity } from './calculations';
import { useDDMData } from './hooks/useDDMData';
import { SUPPORTED_TICKERS } from '../dcf/types';
import type { DDMInputs, DDMResult } from './types';
import DDMSearch from './components/DDMSearch';
import DDMAssumptions from './components/DDMAssumptions';
import DDMResults from './components/DDMResults';

export default function DDM() {
  const [tickerInput, setTickerInput] = useState('');
  const [ticker, setTicker] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [inputs, setInputs] = useState<DDMInputs>({
    currentDividend: 0,
    shortTermGrowth: 8,
    terminalGrowth: 3,
    costOfEquity: 10,
    highGrowthYears: 5,
    modelType: 'gordon',
  });

  const { data, loading, error, fetchData, reset } = useDDMData();

  const filteredTickers = useMemo(() => {
    const q = tickerInput.trim().toUpperCase();
    if (!q) return [...SUPPORTED_TICKERS];
    return SUPPORTED_TICKERS.filter(t => t.includes(q));
  }, [tickerInput]);

  // Auto-fill dividend when data loads
  React.useEffect(() => {
    if (data && data.dividendsPerShareAnnual > 0) {
      setInputs(prev => ({
        ...prev,
        currentDividend: Math.round(data.dividendsPerShareAnnual * 100) / 100,
        costOfEquity: Math.round((0.04 + data.beta * 0.055) * 10000) / 100,
      }));
    }
  }, [data]);

  const result = useMemo((): DDMResult | null => {
    if (!showResults || !data || inputs.currentDividend <= 0) return null;
    try {
      return computeDDM(inputs, data.currentPrice);
    } catch {
      return null;
    }
  }, [showResults, data, inputs]);

  const sensitivity = useMemo(() => {
    if (!result || !data) return null;
    const gSteps = [-0.01, -0.005, 0, 0.005, 0.01].map(d => inputs.terminalGrowth / 100 + d);
    const coeSteps = [-0.02, -0.01, 0, 0.01, 0.02].map(d => inputs.costOfEquity / 100 + d);
    return { matrix: computeDDMSensitivity(inputs, data.currentPrice, gSteps, coeSteps), gSteps, coeSteps };
  }, [result, data, inputs]);

  const [showLoading, setShowLoading] = useState(false);

  const handleDropdownPick = (sym: string) => {
    setTickerInput(sym);
    setShowDropdown(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = tickerInput.trim().toUpperCase();
    if (sym && (SUPPORTED_TICKERS as readonly string[]).includes(sym)) {
      setTickerInput(sym);
      setTicker(sym);
      setShowDropdown(false);
      setShowResults(false);
      setShowLoading(true);
      fetchData(sym);
      setTimeout(() => setShowLoading(false), 2500);
    }
  };

  const handleGoBack = () => {
    reset();
    setTicker('');
    setTickerInput('');
    setShowResults(false);
  };

  const handleInputChange = (patch: Partial<DDMInputs>) => {
    setInputs(prev => ({ ...prev, ...patch }));
  };

  const isValid = !!tickerInput.trim() && (SUPPORTED_TICKERS as readonly string[]).includes(tickerInput.trim().toUpperCase());
  const isLoading = loading || showLoading;

  return (
    <div className="space-y-6">
      {/* Search Landing */}
      {!ticker && (
        <DDMSearch
          tickerInput={tickerInput}
          filteredTickers={filteredTickers}
          showDropdown={showDropdown}
          isValid={isValid}
          onTickerInputChange={setTickerInput}
          onShowDropdown={setShowDropdown}
          onDropdownPick={handleDropdownPick}
          onSearch={handleSearch}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">Analyzing dividend data...</p>
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
      {data && !showResults && !isLoading && (
        <DDMAssumptions
          ticker={ticker}
          data={data}
          inputs={inputs}
          onInputChange={handleInputChange}
          onGoBack={handleGoBack}
          onProceed={() => setShowResults(true)}
        />
      )}

      {/* Results */}
      {result && data && showResults && (
        <DDMResults
          ticker={ticker}
          data={data}
          result={result}
          inputs={inputs}
          sensitivity={sensitivity}
          onGoBack={handleGoBack}
          onAdjust={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
