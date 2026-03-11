// ── localStorage quota guard ───────────────────────────────────────────────────

export function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      Object.keys(localStorage)
        .filter(k => k.startsWith('finnhub_') || k.startsWith('valuwise_') || k.startsWith('tech_') || k.startsWith('market_'))
        .forEach(k => localStorage.removeItem(k));
      try { localStorage.setItem(key, value); } catch { /* skip */ }
    }
  }
}

export function clearCache() {
  const prefixes = ['finnhub_', 'valuwise_', 'tech_', 'market_', 'earnings_', 'insider_', 'news_', 'dividend_'];
  Object.keys(localStorage).filter(k => prefixes.some(p => k.startsWith(p))).forEach(k => localStorage.removeItem(k));
}
