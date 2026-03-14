export function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      clearAllCache(false);
      try { localStorage.setItem(key, value); } catch { /* skip if still full */ }
    }
  }
}

export function clearAllCache(reload = true) {
  const prefixes = ['finnhub_', 'fmp_', 'valuwise_', 'tech_', 'earnings_', 'insider_', 'news_', 'dividend_', 'edgar_', 'multiples_', 'market_cycle_', 'vw_', 'ddm_'];
  Object.keys(localStorage)
    .filter(k => prefixes.some(p => k.startsWith(p)))
    .forEach(k => localStorage.removeItem(k));
  if (reload) {
    window.location.reload();
  }
}
