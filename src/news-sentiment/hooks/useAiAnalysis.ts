import { useState } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';
import { fmtTime } from '../utils/formatters';
import type { NewsArticle } from '../types';

const AI_URL_PRIMARY = 'https://api.shopaikey.com/v1/chat/completions';
const AI_URL_FALLBACK = 'https://api-v2.shopaikey.com/v1/chat/completions';

export function useAiAnalysis() {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');

  const reset = () => {
    setAiAnalysis(null);
    setAiError('');
  };

  const runAiAnalysis = async (symbol: string, articles: NewsArticle[]) => {
    if (!articles.length) return;
    setAiLoading(true);
    setAiError('');
    try {
      const toAnalyze = articles.slice(0, 30);
      const articleList = toAnalyze.map((a, i) =>
        `${i + 1}. [${fmtTime(a.datetime)}] "${a.headline}" — ${a.source}${a.summary ? ` | ${a.summary}` : ''}`
      ).join('\n');

      const prompt = `You are a stock market analyst. Below are the ${toAnalyze.length} most recent news articles from the last 7 days for ${symbol}.

${articleList}

Go through every article above. For each article that is relevant to ${symbol} investors, write a one-line summary with its date. Skip only articles that have absolutely nothing to do with ${symbol} (e.g. articles about completely unrelated companies). When in doubt, include it.

Format each as:
- [DATE] One-line summary of what happened and why it matters.

After listing all relevant articles, write one short paragraph starting with "Bottom Line:" giving the overall investor takeaway.

Do NOT use any markdown formatting. No bold, no headers, no asterisks. Plain text only.`;

      const payload = JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      });
      const fetchOpts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      };

      let res = await proxyFetch(AI_URL_PRIMARY, fetchOpts);
      if (!res.ok) {
        res = await proxyFetch(AI_URL_FALLBACK, fetchOpts);
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI API error (${res.status}): ${errText.slice(0, 300)}`);
      }

      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content;
      if (!text) throw new Error('No response from AI model.');
      setAiAnalysis(text);
    } catch (e: any) {
      setAiError(e.message || 'AI analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  return { aiLoading, aiAnalysis, aiError, runAiAnalysis, reset };
}
