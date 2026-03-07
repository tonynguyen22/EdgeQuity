import React, { useState } from 'react';
import { Search, AlertCircle, TrendingUp, TrendingDown, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { proxyFetch } from './utils/proxyFetch';

const BASE_URL = 'https://finnhub.io/api/v1';

const AI_URL = 'https://api.shopaikey.com/v1beta/models/gemini-2.5-flash:generateContent';
const safeJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  if (!text || text.trim().startsWith('<')) throw new Error('Finnhub returned an error page. This endpoint may not be available on the free plan or the ticker has no data.');
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) throw new Error(`Finnhub: ${parsed.error}`);
    return parsed;
  } catch (e: any) {
    if (e.message?.startsWith('Finnhub:')) throw e;
    throw new Error('Invalid response from API.');
  }
};

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      Object.keys(localStorage)
        .filter(k => k.startsWith('finnhub_') || k.startsWith('valuwise_') || k.startsWith('tech_') || k.startsWith('earnings_') || k.startsWith('insider_') || k.startsWith('news_') || k.startsWith('dividend_'))
        .forEach(k => localStorage.removeItem(k));
      try { localStorage.setItem(key, value); } catch { /* skip */ }
    }
  }
}

function clearCache() {
  const prefixes = ['finnhub_', 'valuwise_', 'tech_', 'earnings_', 'insider_', 'news_', 'dividend_'];
  Object.keys(localStorage).filter(k => prefixes.some(p => k.startsWith(p))).forEach(k => localStorage.removeItem(k));
}

const fmtTime = (unix: number) => {
  if (!unix) return '—';
  const d = new Date(unix * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function NewsSentiment() {
  const [input, setInput] = useState('');
  const [sym, setSym] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');

  const runAiAnalysis = async (symbol: string, articles: any[]) => {
    if (!articles.length) return;
    setAiLoading(true);
    setAiError('');
    try {
      const headlines = articles.slice(0, 15).map((a: any) =>
        `- ${a.headline} (${a.source}, ${fmtTime(a.datetime)})`
      ).join('\n');

      const prompt = `You are a stock market analyst. Given the following recent news headlines for ${symbol}, write exactly 5 bullet points summarizing the most important recent news. After the bullet points, write a brief conclusion stating whether this news is significant or not significant for the stock, and why.\n\nHeadlines:\n${headlines}\n\nRespond in plain text. Use "- " for each bullet point. End with a conclusion paragraph starting with "Conclusion:".`;

      const res = await proxyFetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI API error (${res.status}): ${errText.slice(0, 200)}`);
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No response from AI model.');
      setAiAnalysis(text);
    } catch (e: any) {
      setAiError(e.message || 'AI analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchData = async (symbol: string) => {
    setLoading(true);
    setError('');
    setAiAnalysis(null);
    setAiError('');
    try {
      const cacheKey = `news_${symbol}_v2`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { ts, d } = JSON.parse(cached);
          if (Date.now() - ts < 1 * 60 * 60 * 1000) {
            setData(d);
            runAiAnalysis(symbol, d.articles || []);
            return;
          }
        } catch { localStorage.removeItem(cacheKey); }
      }

      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = now.toISOString().split('T')[0];

      const [newsRes, sentRes] = await Promise.all([
        proxyFetch(`${BASE_URL}/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}`),
        proxyFetch(`${BASE_URL}/news-sentiment?symbol=${symbol}`),
      ]);
      const newsData = await safeJson(newsRes);
      const sentData = await safeJson(sentRes).catch(() => ({}));

      const articles = Array.isArray(newsData) ? newsData.slice(0, 20) : [];

      if (!articles.length && !sentData?.sentiment) {
        throw new Error('No news data found for this ticker. Try a major US-listed stock.');
      }

      const d = { articles, sentiment: sentData };
      safeSetItem(cacheKey, JSON.stringify({ ts: Date.now(), d }));
      setData(d);
      runAiAnalysis(symbol, articles);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch news data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (s) { setSym(s); fetchData(s); }
  };

  const sent = data?.sentiment;
  const bullish = sent?.sentiment?.bullishPercent ?? null;
  const bearish = sent?.sentiment?.bearishPercent ?? null;
  const buzz = sent?.buzz?.buzz ?? null;
  const compScore = sent?.companyNewsScore ?? null;
  const sectorScore = sent?.sectorAverageNewsScore ?? null;

  const SentimentBar = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={`font-semibold ${color}`}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color === 'text-emerald-400' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );

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
          {/* Sentiment Overview */}
          {sent && (bullish !== null || compScore !== null || buzz !== null) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sentiment */}
              {(bullish !== null || bearish !== null) && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300">News Sentiment</h3>
                  {bullish !== null && <SentimentBar value={bullish} label="Bullish" color="text-emerald-400" />}
                  {bearish !== null && <SentimentBar value={bearish} label="Bearish" color="text-red-400" />}
                  <div className="pt-2 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                      {(bullish ?? 0) > 0.6
                        ? <><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 text-sm font-medium">Bullish sentiment</span></>
                        : (bullish ?? 0) < 0.4
                          ? <><TrendingDown className="w-4 h-4 text-red-400" /><span className="text-red-400 text-sm font-medium">Bearish sentiment</span></>
                          : <span className="text-slate-400 text-sm">Neutral sentiment</span>
                      }
                    </div>
                    {sent.sectorAverageBullishPercent != null && (
                      <p className="text-xs text-slate-500 mt-1">
                        Sector avg bullish: {(sent.sectorAverageBullishPercent * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Scores & Buzz */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">News Metrics</h3>
                {compScore !== null && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400 text-sm">Company News Score</span>
                    <span className={`text-sm font-semibold ${compScore > 0.6 ? 'text-emerald-400' : compScore < 0.4 ? 'text-red-400' : 'text-slate-300'}`}>
                      {(compScore * 100).toFixed(0)} / 100
                    </span>
                  </div>
                )}
                {sectorScore !== null && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400 text-sm">Sector Avg Score</span>
                    <span className="text-sm font-semibold text-slate-300">{(sectorScore * 100).toFixed(0)} / 100</span>
                  </div>
                )}
                {buzz !== null && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400 text-sm">Buzz Index</span>
                    <span className={`text-sm font-semibold ${buzz > 1.2 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {buzz.toFixed(2)}x {buzz > 1.2 ? '(high)' : buzz < 0.8 ? '(low)' : '(normal)'}
                    </span>
                  </div>
                )}
                {sent?.buzz?.articlesInLastWeek != null && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 text-sm">Articles Last Week</span>
                    <span className="text-sm font-semibold text-slate-300">{sent.buzz.articlesInLastWeek}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Relative Sentiment */}
          {compScore !== null && sectorScore !== null && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Relative Sentiment</h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{sym} News Score</span>
                      <span className={`font-semibold ${compScore > sectorScore ? 'text-emerald-400' : compScore < sectorScore ? 'text-red-400' : 'text-slate-300'}`}>
                        {(compScore * 100).toFixed(0)}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${Math.min(compScore * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Sector Average</span>
                      <span className="font-semibold text-slate-400">{(sectorScore * 100).toFixed(0)}</span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-slate-500 transition-all" style={{ width: `${Math.min(sectorScore * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {compScore > sectorScore * 1.05 ? (
                    <><TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Above sector average</span>
                    <span className="text-slate-500 text-xs">(+{((compScore - sectorScore) * 100).toFixed(0)} pts)</span></>
                  ) : compScore < sectorScore * 0.95 ? (
                    <><TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium">Below sector average</span>
                    <span className="text-slate-500 text-xs">({((compScore - sectorScore) * 100).toFixed(0)} pts)</span></>
                  ) : (
                    <span className="text-slate-400">In line with sector average</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {(aiLoading || aiAnalysis || aiError) && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-300">AI News Analysis</h3>
              </div>
              {aiLoading && (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  <span className="text-slate-400 text-sm">Analyzing headlines...</span>
                </div>
              )}
              {aiError && (
                <p className="text-red-400 text-sm">{aiError}</p>
              )}
              {aiAnalysis && !aiLoading && (
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{aiAnalysis}</div>
              )}
            </div>
          )}

          {/* News Articles */}
          {data.articles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-200">{sym} — Recent Headlines</h3>
                <span className="text-xs text-slate-500">{data.articles.length} articles, last 30 days</span>
              </div>
              <div className="space-y-2">
                {data.articles.map((article: any, i: number) => (
                  <a
                    key={i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 hover:bg-slate-800/70 hover:border-slate-600/60 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {article.image && (
                        <img
                          src={article.image}
                          alt=""
                          className="w-16 h-12 object-cover rounded-lg shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors leading-snug line-clamp-2">
                            {article.headline}
                          </p>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5 transition-colors" />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-slate-500">{article.source}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-500">{fmtTime(article.datetime)}</span>
                          {article.category && article.category !== 'company news' && (
                            <>
                              <span className="text-slate-700">·</span>
                              <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded capitalize">{article.category}</span>
                            </>
                          )}
                        </div>
                        {article.summary && (
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{article.summary}</p>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {data.articles.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">No news articles found for {sym} in the last 30 days.</div>
          )}
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
