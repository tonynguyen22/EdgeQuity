/* ── Financials — localStorage Helpers ────────────────────────────────── */

const CACHE_PREFIX = 'edgar_';
const CACHE_VERSION = 'v4';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Safe localStorage.setItem with quota error handling.
 * Evicts oldest cache entries if quota is exceeded.
 */
export function safeSetItem(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Evict edgar_ and finnhub_ cache entries on QuotaExceededError
        const prefixes = ['edgar_', 'finnhub_', 'valuwise_', 'tech_', 'earnings_', 'insider_', 'news_', 'dividend_', 'multiples_'];
        const keys = Object.keys(localStorage)
            .filter(k => prefixes.some(p => k.startsWith(p)));
        // Remove oldest first (by stored timestamp if available)
        for (const k of keys) {
            localStorage.removeItem(k);
            try {
                localStorage.setItem(key, value);
                return;
            } catch {
                continue;
            }
        }
    }
}

/**
 * Get cached data if it exists and is within TTL.
 */
export function getCached<T>(symbol: string): T | null {
    const key = `${CACHE_PREFIX}${symbol}_financials_${CACHE_VERSION}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
        const { timestamp, data } = JSON.parse(raw);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
            return data as T;
        }
        localStorage.removeItem(key);
    } catch {
        localStorage.removeItem(key);
    }
    return null;
}

/**
 * Store data in cache with current timestamp.
 */
export function setCache(symbol: string, data: unknown): void {
    const key = `${CACHE_PREFIX}${symbol}_financials_${CACHE_VERSION}`;
    safeSetItem(key, JSON.stringify({ timestamp: Date.now(), data }));
}
