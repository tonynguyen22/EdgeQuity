# News & Sentiment Module

## Overview
Aggregates recent news articles (30-day window), Finnhub sentiment metrics, and an AI-generated summary via Gemini 2.5 Flash. Displays sentiment scores, relative vs. sector, and up to 20 clickable headlines.

## File Structure
```
src/news-sentiment/
├── index.tsx                        # Main component — search, state, composition
├── types.ts                         # TypeScript interfaces (NewsArticle, SentimentData, NewsData)
├── news-sentiment.md                # This file
├── components/
│   ├── SentimentOverview.tsx        # Bullish/Bearish bars, news metrics panel, relative sentiment bars
│   ├── AiAnalysis.tsx               # AI summary card (loading / result / error states)
│   └── NewsArticles.tsx             # Article list with image, headline, source, date, summary
├── hooks/
│   ├── useNewsData.ts               # Fetch news + sentiment from Finnhub, cache (TTL 1h), state
│   └── useAiAnalysis.ts             # Gemini 2.5 Flash prompt, streaming-safe fetch, state
└── utils/
    ├── storage.ts                   # safeSetItem() with eviction, clearCache()
    └── formatters.ts                # fmtTime() — converts Unix timestamp to "Jan 1, 2025"
```

## Data Sources
| Source | Endpoint | Data |
|--------|----------|------|
| Finnhub | `/company-news?symbol={sym}&from={from}&to={to}` | Up to 20 articles (30-day window) |
| Finnhub | `/news-sentiment?symbol={sym}` | Bullish/Bearish %, buzz index, company/sector scores |
| Gemini 2.5 Flash | `api.shopaikey.com/v1beta/models/gemini-2.5-flash:generateContent` | AI narrative summary |

## Cache
- Key: `news_{symbol}_v2`
- TTL: **1 hour** (shorter than other modules — news is time-sensitive)
- AI analysis is **not cached** — re-runs on every fresh fetch.

## Hooks

### `useNewsData()`
Returns `{ data, loading, error, fetchData }`. `fetchData` returns the fetched `NewsData` object directly so the caller can immediately pass articles to `runAiAnalysis` without waiting for a React state update cycle.

### `useAiAnalysis()`
Returns `{ aiLoading, aiAnalysis, aiError, runAiAnalysis, reset }`. `reset()` clears prior AI state before a new search. `runAiAnalysis(symbol, articles)` sends up to 15 headlines to Gemini and sets the plain-text response.

## AI Prompt
Sends up to 15 formatted headlines to Gemini with instructions to:
1. Write exactly 5 bullet points summarizing the most important news themes
2. Append a "Conclusion:" paragraph assessing significance

## Sentiment Thresholds
| Metric | Bullish | Neutral | Bearish |
|--------|---------|---------|---------|
| Bullish % | > 60% | 40–60% | < 40% |
| Company Score | > 0.6 | 0.4–0.6 | < 0.4 |
| Buzz Index | > 1.2x (high) | 0.8–1.2x | < 0.8x (low) |
| vs Sector | > 5% above | ±5% | > 5% below |
