function hashSeed(input: string): number {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function scoreTicker(ticker: string, seed: string): number {
  return hashSeed(seed + ':' + ticker.toUpperCase());
}

export function pickAuditSample(
  universe: string[],
  size: number,
  seed: string,
  requiredTickers: string[] = ['NVDA'],
): string[] {
  const uniqueUniverse = [...new Set(universe.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
  const universeSet = new Set(uniqueUniverse);
  const required = [...new Set(requiredTickers.map((ticker) => ticker.trim().toUpperCase()))]
    .filter((ticker) => universeSet.has(ticker))
    .slice(0, Math.max(0, size));
  const requiredSet = new Set(required);
  const remaining = uniqueUniverse
    .filter((ticker) => !requiredSet.has(ticker))
    .sort((left, right) => scoreTicker(left, seed) - scoreTicker(right, seed));

  return [...required, ...remaining].slice(0, Math.max(0, size));
}
