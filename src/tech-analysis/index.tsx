import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTechData } from './hooks/useTechData';
import SearchForm from './components/SearchForm';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import LandingHint from './components/LandingHint';
import TickerHeader from './components/TickerHeader';
import SignalSummary from './components/SignalSummary';
import TimeframeToggle from './components/TimeframeToggle';
import IndicatorSections from './components/IndicatorSections';
import SupportResistance from './components/SupportResistance';
import AiAnalysis from './components/AiAnalysis';
import { clearCache } from './utils/storage';
import SupportedTickersBySector from '../components/SupportedTickersBySector';

export default function TechAnalysis() {
  const {
    tickerInput, setTickerInput, loading, error,
    dailyData, weeklyData, srData,
    displayName, activeTimeframe, setActiveTimeframe, handleSearch, reset,
  } = useTechData();

  const [showLoading, setShowLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    setShowLoading(true);
    await handleSearch(e);
    setTimeout(() => setShowLoading(false), 2500);
  };

  const activeData = activeTimeframe === 'W1' && weeklyData ? weeklyData : dailyData;
  const isLoading = loading || showLoading;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero title + search — shown when no results */}
      {!isLoading && !error && !dailyData && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--vw-text-primary)' }}>
              Technical <span style={{ color: 'var(--vw-accent)' }}>Analysis</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
              20+ indicators across daily and weekly timeframes
            </p>
          </div>

          <SearchForm tickerInput={tickerInput} setTickerInput={setTickerInput} loading={isLoading} onSubmit={handleAnalyze} />

          <div className="w-full max-w-2xl mt-8 rounded-xl p-6 space-y-4" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--vw-border-dim)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--vw-text-primary)' }}>What you'll see here</p>
            <ul className="space-y-2.5">
              {[
                'Computes 20+ technical indicators (RSI, MACD, Bollinger Bands, moving averages, and more)',
                'Analyzes both daily and weekly timeframes so you can compare short-term vs. long-term trends',
                'Provides a 5-level signal score from Strong Sell to Strong Buy',
                'Identifies support and resistance zones to help you spot potential buy zones',
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

      {/* When we have results, show go back button */}
      {dailyData && !isLoading && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => { reset(); setShowLoading(false); }}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white">{displayName}</h2>
        </div>
      )}

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState error={error} onClearCache={clearCache} />}
      {!isLoading && dailyData && (
        <div className="space-y-6">
          <TickerHeader
            displayName={displayName}
            close={dailyData.indicators.close}
            yearChange={dailyData.indicators.yearChange}
          />

          <SignalSummary
            dailySignal={dailyData.signal}
            weeklySignal={weeklyData?.signal ?? null}
            activeTimeframe={activeTimeframe}
          />

          <TimeframeToggle
            active={activeTimeframe}
            onChange={setActiveTimeframe}
            dailySignal={dailyData.signal}
            weeklySignal={weeklyData?.signal ?? null}
          />

          {activeData && <IndicatorSections cards={activeData.cards} />}

          {srData && <SupportResistance data={srData} />}

          <AiAnalysis
            symbol={displayName}
            currentPrice={dailyData.indicators.close}
            dailyData={dailyData}
            weeklyData={weeklyData}
            srData={srData}
          />
        </div>
      )}
    </div>
  );
}
