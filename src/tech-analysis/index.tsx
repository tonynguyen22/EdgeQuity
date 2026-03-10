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

export default function TechAnalysis() {
  const {
    tickerInput, setTickerInput, loading, error,
    dailyData, weeklyData, srData,
    displayName, activeTimeframe, setActiveTimeframe, handleSearch,
  } = useTechData();

  const activeData = activeTimeframe === 'W1' && weeklyData ? weeklyData : dailyData;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <SearchForm tickerInput={tickerInput} setTickerInput={setTickerInput} loading={loading} onSubmit={handleSearch} />
      {loading && <LoadingState />}
      {!loading && error && <ErrorState error={error} onClearCache={clearCache} />}
      {!loading && !error && !dailyData && <LandingHint />}
      {!loading && dailyData && (
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
