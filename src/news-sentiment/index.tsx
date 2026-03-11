import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { useNewsData } from './hooks/useNewsData';
import { useAiAnalysis } from './hooks/useAiAnalysis';
import { clearCache } from './utils/storage';
import SentimentOverview from './components/SentimentOverview';
import AiAnalysis from './components/AiAnalysis';
import NewsArticles from './components/NewsArticles';

export default function NewsSentiment() {
  const [input, setInput] = useState('');
  const [sym, setSym] = useState('');
  const { data, loading, error, fetchData } = useNewsData();
  const { aiLoading, aiAnalysis, aiError, runAiAnalysis, reset: resetAi } = useAiAnalysis();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (!s) return;
    setSym(s);
    resetAi();
    const result = await fetchData(s);
    if (result?.articles?.length) {
      runAiAnalysis(s, result.articles);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">News & Sentiment</h2>
        <p className="text-slate-400 text-sm">Latest news headlines with AI-powered sentiment analysis.</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter ticker (e.g. AAPL, MSFT)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent uppercase transition-all"
        />
        <button type="submit" disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Analyze
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 py-8 max-w-xl mx-auto">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading news &amp; sentiment...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
            <button onClick={clearCache} className="mt-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors">Clear Cache & Retry</button>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {data.sentiment && <SentimentOverview sent={data.sentiment} sym={sym} />}
          <AiAnalysis aiLoading={aiLoading} aiAnalysis={aiAnalysis} aiError={aiError} />
          <NewsArticles articles={data.articles} sym={sym} />
        </div>
      )}

      {!data && !loading && !error && (
        <div className="max-w-xl mx-auto bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 space-y-2">
          <p className="text-sm font-medium text-slate-300">What you'll see here</p>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li className="flex items-start gap-2"><span className="text-sky-500 mt-0.5">•</span>AI-generated summary of the 5 most important recent news themes</li>
            <li className="flex items-start gap-2"><span className="text-sky-500 mt-0.5">•</span>Significance assessment — whether recent news is material for the stock</li>
            <li className="flex items-start gap-2"><span className="text-sky-500 mt-0.5">•</span>Bullish/bearish sentiment score derived from news coverage</li>
            <li className="flex items-start gap-2"><span className="text-sky-500 mt-0.5">•</span>Up to 20 recent news articles with headline, source, date, and summary</li>
          </ul>
        </div>
      )}
    </div>
  );
}
