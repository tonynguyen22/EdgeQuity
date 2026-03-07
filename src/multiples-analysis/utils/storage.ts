export function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      const prefixes = ['fmp_', 'finnhub_', 'valuwise_', 'tech_', 'earnings_', 'insider_', 'news_', 'dividend_', 'multiples_'];
      Object.keys(localStorage)
        .filter(k => prefixes.some(p => k.startsWith(p)))
        .forEach(k => localStorage.removeItem(k));
      try { localStorage.setItem(key, value); } catch { /* skip if still full */ }
    }
  }
}
