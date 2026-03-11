import { useState } from 'react';
import { proxyFetch } from '../../utils/proxyFetch';
import { fmtTime } from '../utils/formatters';
import type { NewsArticle } from '../types';

const AI_URL = 'https://api.shopaikey.com/v1beta/models/gemini-2.5-flash:generateContent';

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
      const headlines = articles.slice(0, 15).map(a =>
        `- ${a.headline} (${a.source}, ${fmtTime(a.datetime)})`
      ).join('\n');

      const prompt = `You are a stock market analyst. Given the following recent news headlines for ${symbol}, write exactly 5 bullet points summarizing the most important recent news. After the bullet points, write a brief conclusion stating whether this news is significant or not significant for the stock, and why.\n\nHeadlines:\n${headlines}\n\nRespond in plain text. Use "- " for each bullet point. End with a conclusion paragraph starting with "Conclusion:".`;

      const res = await proxyFetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
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

  return { aiLoading, aiAnalysis, aiError, runAiAnalysis, reset };
}
