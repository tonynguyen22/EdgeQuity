/* ── Peer Analysis — localStorage Helper ──────────────────────────────── */

export function safeSetItem(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            Object.keys(localStorage)
                .filter(k => k.startsWith('finnhub_') || k.startsWith('valuwise_'))
                .forEach(k => localStorage.removeItem(k));
            try { localStorage.setItem(key, value); } catch { /* skip if still full */ }
        }
    }
}
