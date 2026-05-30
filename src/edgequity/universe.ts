import { AI_INFRASTRUCTURE_UNIVERSE } from '../../scripts/edgequity/ai-universe.ts';

export const EDGEQUITY_SUPPORTED_TICKERS = AI_INFRASTRUCTURE_UNIVERSE.map((stock) => stock.ticker);

export type EdgequityTicker = typeof EDGEQUITY_SUPPORTED_TICKERS[number];
