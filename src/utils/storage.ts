// ── Canonical localStorage utilities ────────────────────────────────────────
// Single source of truth for cache management across all modules.
// All cache prefixes MUST be listed here — add new ones to CACHE_PREFIXES only.

const CACHE_PREFIXES = [
  'finnhub_', 'fmp_', 'valuwise_', 'vw_', 'tech_', 'earnings_',
  'insider_', 'news_', 'dividend_', 'edgar_', 'multiples_',
  'market_cycle_', 'ddm_', 'stmt_',
] as const;

/**
 * Write to localStorage with automatic cache eviction on quota exceeded.
 * When quota is hit, clears all known cache keys and retries once.
 */
export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      clearAllCache(false);
      try { localStorage.setItem(key, value); } catch { /* skip if still full */ }
    }
  }
}

/**
 * Clear all Fundra cache entries from localStorage.
 * @param reload - If true, reloads the page after clearing (default: true)
 */
export function clearAllCache(reload = true): void {
  Object.keys(localStorage)
    .filter(k => CACHE_PREFIXES.some(p => k.startsWith(p)))
    .forEach(k => localStorage.removeItem(k));
  if (reload) {
    window.location.reload();
  }
}

/** Alias for clearAllCache(false) — clears cache without page reload. */
export const clearCache = () => clearAllCache(false);
