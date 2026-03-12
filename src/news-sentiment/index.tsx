import React, { useState, useCallback } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import TickerSearch from '../components/TickerSearch';
import TabLanding from '../components/TabLanding';
import { useNewsData } from './hooks/useNewsData';
import { useAiAnalysis } from './hooks/useAiAnalysis';
import { clearCache } from './utils/storage';
import SentimentOverview from './components/SentimentOverview';
import AiAnalysis from './components/AiAnalysis';
import NewsArticles from './components/NewsArticles';

export default function NewsSentiment() {
  const [input, setInput] = useState('');
  const [sym, setSym] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const { data, loading, error, fetchData, reset: resetNews } = useNewsData();
  const { aiLoading, aiAnalysis, aiError, runAiAnalysis, reset: resetAi } = useAiAnalysis();

  const handleAnalyze = useCallback(async (s: string) => {
    setSym(s);
    setShowLoading(true);
    resetAi();
    await fetchData(s);
    setTimeout(() => setShowLoading(false), 2500);
  }, [fetchData, resetAi]);

  const handleGoBack = () => {
    setSym('');
    setInput('');
    setShowLoading(false);
    resetNews();
    resetAi();
  };

  const handleRunAi = () => {
    if (data?.articles?.length && sym) {
      runAiAnalysis(sym, data.articles);
    }
  };

  const isLoading = loading || showLoading;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Landing — shown when no results */}
      {!data && !isLoading && !error && (
        <TabLanding
          title="News &"
          accentTitle="Sentiment"
          subtitle="Latest news headlines with AI-powered sentiment analysis"
          aboutItems={[
            'Pulls the latest news articles from financial sources for any supported stock',
            'Shows a sentiment score (bullish/bearish) based on recent headlines',
            'Optionally generates an AI-written investor briefing summarizing risks, catalysts, and key takeaways',
            'Great for a quick pulse check before making a decision',
          ]}
          searchInput={input}
          setSearchInput={setInput}
          onAnalyze={handleAnalyze}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">Loading news & sentiment…</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
            <button onClick={clearCache} className="mt-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors">Clear Cache & Retry</button>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !isLoading && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'var(--vw-bg-raised)', border: '1px solid var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">{sym}</h2>
          </div>

          {data.sentiment && <SentimentOverview sent={data.sentiment} sym={sym} />}
          <AiAnalysis aiLoading={aiLoading} aiAnalysis={aiAnalysis} aiError={aiError} onRun={handleRunAi} />
          <NewsArticles articles={data.articles} sym={sym} />
        </div>
      )}
    </div>
  );
}
