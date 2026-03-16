import { useState, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { proxyFetch } from '../../utils/proxyFetch';
import type { TimeframeData, SupportResistanceResult } from '../types';

const AI_URL = 'https://api.shopaikey.com/v1beta/models/gemini-3-flash-preview:generateContent';

interface AiAnalysisProps {
  symbol: string;
  currentPrice: number;
  dailyData: TimeframeData;
  weeklyData: TimeframeData | null;
  srData: SupportResistanceResult | null;
}

function buildPrompt(symbol: string, price: number, daily: TimeframeData, weekly: TimeframeData | null, sr: SupportResistanceResult | null): string {
  const d = daily.indicators;
  const w = weekly?.indicators;

  let prompt = `You are an expert technical analyst. Analyze the stock ${symbol} (current price: $${price.toFixed(2)}) using the following technical indicators across two timeframes.\n\n`;

  prompt += `=== DAILY (D1) INDICATORS ===\n`;
  prompt += `Signal Score: ${daily.signal.score}/100 (${daily.signal.label})\n`;
  prompt += `RSI(14): ${d.rsi?.toFixed(1) ?? 'N/A'}\n`;
  prompt += `MACD: ${d.macd?.toFixed(3) ?? 'N/A'} / Signal: ${d.macdSignal?.toFixed(3) ?? 'N/A'} / Hist: ${d.macdHist?.toFixed(3) ?? 'N/A'}\n`;
  prompt += `Stochastic %K/%D: ${d.stochK?.toFixed(1) ?? 'N/A'} / ${d.stochD?.toFixed(1) ?? 'N/A'}\n`;
  prompt += `Williams %R: ${d.williamsR?.toFixed(1) ?? 'N/A'}\n`;
  prompt += `CCI(20): ${d.cci?.toFixed(0) ?? 'N/A'}\n`;
  prompt += `MFI(14): ${d.mfi?.toFixed(1) ?? 'N/A'}\n`;
  prompt += `StochRSI: ${d.stochRsi?.toFixed(1) ?? 'N/A'}\n`;
  prompt += `ADX(14): ${d.adx?.toFixed(1) ?? 'N/A'}\n`;
  prompt += `Parabolic SAR: $${d.psar?.toFixed(2) ?? 'N/A'} (${d.psarTrend ?? 'N/A'})\n`;
  prompt += `EMA 9: $${d.ema9?.toFixed(2) ?? 'N/A'} | EMA 21: $${d.ema21?.toFixed(2) ?? 'N/A'} | EMA 9 ${d.ema9 && d.ema21 ? (d.ema9 > d.ema21 ? '>' : '<') : '?'} EMA 21\n`;
  prompt += `SMA 20: $${d.sma20?.toFixed(2) ?? 'N/A'} (${d.pctVsSMA20?.toFixed(1) ?? '?'}%)\n`;
  prompt += `SMA 50: $${d.sma50?.toFixed(2) ?? 'N/A'} (${d.pctVsSMA50?.toFixed(1) ?? '?'}%)\n`;
  prompt += `SMA 200: $${d.sma200?.toFixed(2) ?? 'N/A'} (${d.pctVsSMA200?.toFixed(1) ?? '?'}%)\n`;
  prompt += `Bollinger %B: ${d.bbPctB !== null ? (d.bbPctB * 100).toFixed(1) + '%' : 'N/A'} | Width: ${d.bbWidth !== null ? (d.bbWidth * 100).toFixed(1) + '%' : 'N/A'}\n`;
  prompt += `ATR(14): $${d.atr?.toFixed(2) ?? 'N/A'} (${d.atrPct?.toFixed(1) ?? '?'}% of price)\n`;
  prompt += `ROC 10d: ${d.roc10?.toFixed(1) ?? 'N/A'}% | ROC 20d: ${d.roc20?.toFixed(1) ?? 'N/A'}%\n`;
  prompt += `OBV Direction: ${d.obvDirection ?? 'N/A'}\n`;
  prompt += `Volume Ratio: ${d.volRatio?.toFixed(2) ?? 'N/A'}x avg\n`;
  prompt += `52-Week: High $${d.high52w.toFixed(2)} | Low $${d.low52w.toFixed(2)} | Position: ${d.pos52w.toFixed(0)}%\n`;

  if (w) {
    prompt += `\n=== WEEKLY (W1) INDICATORS ===\n`;
    prompt += `Signal Score: ${weekly!.signal.score}/100 (${weekly!.signal.label})\n`;
    prompt += `RSI(14): ${w.rsi?.toFixed(1) ?? 'N/A'}\n`;
    prompt += `MACD: ${w.macd?.toFixed(3) ?? 'N/A'} / Signal: ${w.macdSignal?.toFixed(3) ?? 'N/A'}\n`;
    prompt += `Stochastic %K/%D: ${w.stochK?.toFixed(1) ?? 'N/A'} / ${w.stochD?.toFixed(1) ?? 'N/A'}\n`;
    prompt += `CCI(20): ${w.cci?.toFixed(0) ?? 'N/A'}\n`;
    prompt += `MFI(14): ${w.mfi?.toFixed(1) ?? 'N/A'}\n`;
    prompt += `ADX(14): ${w.adx?.toFixed(1) ?? 'N/A'}\n`;
    prompt += `PSAR: $${w.psar?.toFixed(2) ?? 'N/A'} (${w.psarTrend ?? 'N/A'})\n`;
    prompt += `SMA 20: $${w.sma20?.toFixed(2) ?? 'N/A'} (${w.pctVsSMA20?.toFixed(1) ?? '?'}%)\n`;
    prompt += `SMA 50: $${w.sma50?.toFixed(2) ?? 'N/A'} (${w.pctVsSMA50?.toFixed(1) ?? '?'}%)\n`;
    prompt += `Bollinger %B: ${w.bbPctB !== null ? (w.bbPctB * 100).toFixed(1) + '%' : 'N/A'}\n`;
    prompt += `ATR(14): $${w.atr?.toFixed(2) ?? 'N/A'}\n`;
    prompt += `OBV Direction: ${w.obvDirection ?? 'N/A'}\n`;
  }

  if (sr) {
    prompt += `\n=== SUPPORT & RESISTANCE ===\n`;
    const supports = sr.levels.filter(l => l.type === 'support').sort((a, b) => b.price - a.price).slice(0, 5);
    const resistances = sr.levels.filter(l => l.type === 'resistance').sort((a, b) => a.price - b.price).slice(0, 5);
    if (resistances.length) prompt += `Resistance: ${resistances.map(l => `$${l.price.toFixed(2)} (${l.label})`).join(', ')}\n`;
    if (supports.length) prompt += `Support: ${supports.map(l => `$${l.price.toFixed(2)} (${l.label})`).join(', ')}\n`;
    if (sr.entryZones.length > 0) {
      sr.entryZones.forEach(zone => {
        prompt += `${zone.label}: $${zone.low.toFixed(2)} - $${zone.high.toFixed(2)} (${zone.confluenceCount} levels, ${zone.strength})\n`;
      });
    }
  }

  prompt += `\n=== INSTRUCTIONS ===\n`;
  prompt += `Based on ALL the indicators above across BOTH timeframes, provide a structured analysis. Be specific with price levels. Use the actual indicator values to justify your reasoning.\n`;
  prompt += `Do NOT use any markdown formatting. No **, no *, no #, no backticks. Use plain text only.\n`;
  prompt += `Keep the response concise. Each section should be 1-2 sentences max, bullet points should be one line each.\n\n`;
  prompt += `Respond in this exact format:\n\n`;
  prompt += `VERDICT: [BUY / WAIT / AVOID]\n\n`;
  prompt += `CONFIDENCE: [percentage, e.g. 72%]\n\n`;
  prompt += `SUMMARY: [2-3 sentence overall assessment combining daily and weekly signals]\n\n`;
  prompt += `If VERDICT is BUY:\n`;
  prompt += `ENTRY RANGE: [$low - $high] (explain why this range)\n`;
  prompt += `STOP LOSS: [$price] (based on nearest support or ATR)\n`;
  prompt += `TARGET: [$price] (based on nearest resistance)\n\n`;
  prompt += `If VERDICT is WAIT:\n`;
  prompt += `WAIT FOR: [specific conditions to watch for, e.g. "RSI to drop below 40" or "price to test SMA 50 at $X"]\n`;
  prompt += `IDEAL ENTRY ZONE: [$low - $high] (the price range to wait for)\n`;
  prompt += `TRIGGER: [what signal would confirm it is time to buy]\n\n`;
  prompt += `If VERDICT is AVOID:\n`;
  prompt += `REASON: [why the stock should be avoided right now]\n`;
  prompt += `REVISIT WHEN: [what needs to change before reconsidering]\n\n`;
  prompt += `KEY OBSERVATIONS: [3-5 bullet points highlighting the most important signals from both timeframes. Mention specific indicator names and values. Note any divergences between daily and weekly signals.]\n\n`;
  prompt += `RISK FACTORS: [2-3 bullet points about risks to this analysis]\n`;

  return prompt;
}

function stripMarkdown(s: string): string {
  return s.replace(/\*{1,2}/g, '').replace(/`/g, '').replace(/^#+\s*/gm, '');
}

function parseAiResponse(text: string) {
  const cleaned = stripMarkdown(text);
  const lines = cleaned.split('\n');
  const sections: { label: string; content: string }[] = [];
  let currentLabel = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^([A-Z][A-Z\s]+?):\s*(.*)/);
    if (headerMatch) {
      if (currentLabel) {
        sections.push({ label: currentLabel, content: currentContent.join('\n').trim() });
      }
      currentLabel = headerMatch[1].trim();
      currentContent = headerMatch[2] ? [headerMatch[2]] : [];
    } else if (currentLabel) {
      currentContent.push(line);
    }
  }
  if (currentLabel) {
    sections.push({ label: currentLabel, content: currentContent.join('\n').trim() });
  }
  return sections;
}

function verdictColor(verdict: string) {
  const v = verdict.toUpperCase();
  if (v.includes('BUY')) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  if (v.includes('AVOID')) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/40' };
  return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
}

export default function AiAnalysis({ symbol, currentPrice, dailyData, weeklyData, srData }: AiAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState('');

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const prompt = buildPrompt(symbol, currentPrice, dailyData, weeklyData, srData);
      const res = await proxyFetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setAnalysis(text);
    } catch (e: any) {
      setError(e.message || 'AI analysis failed.');
    } finally {
      setLoading(false);
    }
  }, [symbol, currentPrice, dailyData, weeklyData, srData]);

  const sections = analysis ? parseAiResponse(analysis) : [];
  const verdictSection = sections.find(s => s.label === 'VERDICT');
  const vc = verdictSection ? verdictColor(verdictSection.content) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">AI Technical Analysis</h3>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : analysis ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Run AI Analysis'}
        </button>
      </div>

      {!analysis && !loading && !error && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Uses AI (Gemini) to analyze all daily and weekly indicators, support/resistance levels, and determine whether now is a good entry point. Provides specific price ranges for entry, stop-loss, and targets.
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          <span className="text-sm text-slate-400">AI is analyzing {symbol} across both timeframes...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {analysis && sections.length > 0 && (
        <div className={`rounded-xl border p-5 space-y-4 ${vc?.bg ?? 'bg-slate-800/30'} ${vc?.border ?? 'border-slate-700/30'}`}>
          {/* Verdict + Confidence header */}
          {verdictSection && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${vc?.badge}`}>
                {verdictSection.content}
              </span>
              {sections.find(s => s.label === 'CONFIDENCE') && (
                <span className="text-sm text-slate-400">
                  Confidence: <span className="font-semibold text-slate-200">{sections.find(s => s.label === 'CONFIDENCE')!.content}</span>
                </span>
              )}
            </div>
          )}

          {/* Remaining sections */}
          {sections
            .filter(s => s.label !== 'VERDICT' && s.label !== 'CONFIDENCE')
            .map((s, i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-wide">{s.label}</p>
                <div className="text-sm text-slate-300 leading-relaxed">
                  {s.content.split('\n').map((line, j) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                      return (
                        <div key={j} className="flex gap-2 mt-1">
                          <span className="text-slate-500 shrink-0">-</span>
                          <span>{trimmed.slice(2)}</span>
                        </div>
                      );
                    }
                    return <p key={j} className={j > 0 ? 'mt-1' : ''}>{trimmed}</p>;
                  })}
                </div>
              </div>
            ))}

          <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-700/30">
            AI analysis is for informational purposes only and should not be considered financial advice. Always do your own research before making investment decisions.
          </p>
        </div>
      )}

      {/* Fallback: raw text if parsing fails */}
      {analysis && sections.length === 0 && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{analysis}</p>
          <p className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-700/30">
            AI analysis is for informational purposes only and should not be considered financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
