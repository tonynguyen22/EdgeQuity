/* ── Peer Analysis — Shared Types ─────────────────────────────────────── */

export interface PeerSuggestion {
    symbol: string;
    name: string;
    isUS: boolean;
}

export interface HistEvEbitda {
    year: string;
    evEbitda: number | null;
}

export interface PeerData {
    symbol: string;
    name: string;
    rev: number;
    revGrowth: number;
    ebitda: number;
    ebitdaMargin: number;
    netIncome: number;
    niMargin: number;
    price: number;
    marketCap: number;
    ev: number;
    evToRev: number;
    evToEbitda: number;
    pToSales: number;
    pToE: number;
    pToBook: number;
    pToFCF: number;
    totalDebt: number;
    totalCash: number;
    totalEquity: number;
    sharesOut: number;
    fcf: number;
    histEvEbitda: HistEvEbitda[];
}

export interface StatsResult {
    mean: number;
    median: number;
    p25: number;
    p75: number;
}

export interface AllStats {
    revGrowth: StatsResult;
    ebitda: StatsResult;
    ebitdaMargin: StatsResult;
    netIncome: StatsResult;
    niMargin: StatsResult;
    price: StatsResult;
    marketCap: StatsResult;
    ev: StatsResult;
    evToRev: StatsResult;
    evToEbitda: StatsResult;
    pToSales: StatsResult;
    pToE: StatsResult;
    pToBook: StatsResult;
    pToFCF: StatsResult;
}

export interface ImpliedPrice {
    label: string;
    price: number | null;
}

export interface TargetPercentiles {
    revGrowth: number | null;
    ebitdaMargin: number | null;
    evToRev: number | null;
    evToEbitda: number | null;
    pToSales: number | null;
    pToE: number | null;
    pToBook: number | null;
    pToFCF: number | null;
}

export interface RadarScorePoint {
    subject: string;
    target: number;
    median: number;
}

export interface RankingRow {
    symbol: string;
    value: number;
    isTarget: boolean;
}

export interface RankingData {
    evToEbitda: RankingRow[];
    pToE: RankingRow[];
    evToRev: RankingRow[];
    revGrowth: RankingRow[];
}

export interface BubblePoint {
    x: number | null;
    y: number;
    z: number;
    symbol: string;
    isTarget: boolean;
}
