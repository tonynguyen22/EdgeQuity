import { useMemo } from 'react';
import { useTechData } from './hooks/useTechData';
import { buildIndicatorCards } from './calculations';
import SearchForm from './components/SearchForm';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import LandingHint from './components/LandingHint';
import TickerHeader from './components/TickerHeader';
import SignalSummary from './components/SignalSummary';
import IndicatorSections from './components/IndicatorSections';
import { clearCache } from './utils/storage';

export default function TechAnalysis() {
  const { tickerInput, setTickerInput, loading, error, indicators, signal, displayName, snapState, handleSearch } = useTechData();
  const cards = useMemo(
    () => indicators && signal ? buildIndicatorCards(indicators, snapState) : [],
    [indicators, signal, snapState]
  );

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <SearchForm tickerInput={tickerInput} setTickerInput={setTickerInput} loading={loading} onSubmit={handleSearch} />
      {loading && <LoadingState />}
      {!loading && error && <ErrorState error={error} onClearCache={clearCache} />}
      {!loading && !error && !indicators && <LandingHint />}
      {!loading && indicators && signal && (
        <div className="space-y-6">
          <TickerHeader displayName={displayName} close={indicators.close} yearChange={indicators.yearChange} />
          <SignalSummary signal={signal} />
          <IndicatorSections cards={cards} />
        </div>
      )}
    </div>
  );
}
