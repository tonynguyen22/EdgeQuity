import { parseNum } from './utils/formatters';
import type {
  LetterGrade, MetricResult, CategoryResult, GradeResult,
  YearGrade, AltmanZResult, PiotroskiResult, DuPontYear,
  WorkingCapitalYear, EarningsQualityResult, HistoricalYear, QualityData,
} from './types';

// ─── Math helpers ──────────────────────────────────────────────────────────────

const safeAvg = (values: number[]): number => {
  const valid = values.filter(v => isFinite(v) && !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

const safeDivide = (num: number, den: number): number => {
  if (!den || !isFinite(den) || isNaN(den)) return 0;
  if (!isFinite(num) || isNaN(num)) return 0;
  return num / den;
};

// ─── Grade mappers ─────────────────────────────────────────────────────────────

export const gradeToScore = (g: LetterGrade): number => ({ A: 4, B: 3, C: 2, D: 1 }[g]);

export const scoreToGrade = (s: number): LetterGrade => {
  if (s >= 3.5) return 'A';
  if (s >= 2.5) return 'B';
  if (s >= 1.5) return 'C';
  return 'D';
};

export const scoreTo100 = (s: number): number => Math.round(((s - 1) / 3) * 100);

export const gradeToScore100 = (g: LetterGrade): number => ({ A: 100, B: 75, C: 50, D: 25 }[g]);

// ─── Per-metric grading thresholds ─────────────────────────────────────────────

const gradeCurrRatio    = (v: number): LetterGrade => v >= 2.0 ? 'A' : v >= 1.5 ? 'B' : v >= 1.0 ? 'C' : 'D';
const gradeQuickRatio   = (v: number): LetterGrade => v >= 1.5 ? 'A' : v >= 1.0 ? 'B' : v >= 0.7 ? 'C' : 'D';
const gradeDebtToEquity = (v: number): LetterGrade => v <= 0.3 ? 'A' : v <= 0.7 ? 'B' : v <= 1.5 ? 'C' : 'D';
const gradeIntCoverage  = (v: number): LetterGrade => v >= 10  ? 'A' : v >= 5   ? 'B' : v >= 2   ? 'C' : 'D';
const gradeGrossMargin  = (v: number): LetterGrade => v >= 0.60 ? 'A' : v >= 0.40 ? 'B' : v >= 0.20 ? 'C' : 'D';
const gradeEbitdaMargin = (v: number): LetterGrade => v >= 0.30 ? 'A' : v >= 0.20 ? 'B' : v >= 0.10 ? 'C' : 'D';
const gradeNetMargin    = (v: number): LetterGrade => v >= 0.20 ? 'A' : v >= 0.10 ? 'B' : v >= 0.05 ? 'C' : 'D';
const gradeROE          = (v: number): LetterGrade => v >= 0.20 ? 'A' : v >= 0.12 ? 'B' : v >= 0.05 ? 'C' : 'D';
const gradeROA          = (v: number): LetterGrade => v >= 0.10 ? 'A' : v >= 0.05 ? 'B' : v >= 0.02 ? 'C' : 'D';
const gradeRevGrowth    = (v: number): LetterGrade => v >= 0.15 ? 'A' : v >= 0.08 ? 'B' : v >= 0.03 ? 'C' : 'D';
const gradeEpsGrowth    = (v: number): LetterGrade => v >= 0.15 ? 'A' : v >= 0.08 ? 'B' : v >= 0.03 ? 'C' : 'D';
const gradeFcfMargin    = (v: number): LetterGrade => v >= 0.15 ? 'A' : v >= 0.08 ? 'B' : v >= 0.03 ? 'C' : 'D';
const gradeFcfConv      = (v: number): LetterGrade => v >= 1.00 ? 'A' : v >= 0.60 ? 'B' : v >= 0.20 ? 'C' : 'D';
const gradeCfoMargin    = (v: number): LetterGrade => v >= 0.20 ? 'A' : v >= 0.12 ? 'B' : v >= 0.05 ? 'C' : 'D';

// ─── Trend detection ───────────────────────────────────────────────────────────

const detectTrend = (values: number[]): 'improving' | 'stable' | 'declining' => {
  const v = values.filter(x => isFinite(x) && !isNaN(x));
  if (v.length < 2) return 'stable';
  const mid = Math.max(1, Math.floor(v.length / 2));
  const first = safeAvg(v.slice(0, mid));
  const last = safeAvg(v.slice(mid));
  if (first === 0) return last > 0 ? 'improving' : 'stable';
  const change = (last - first) / Math.abs(first);
  if (change > 0.05) return 'improving';
  if (change < -0.05) return 'declining';
  return 'stable';
};

const detectTrendInverted = (values: number[]): 'improving' | 'stable' | 'declining' => {
  const t = detectTrend(values);
  return t === 'improving' ? 'declining' : t === 'declining' ? 'improving' : 'stable';
};

// ─── Build historical summary from raw FMP data ───────────────────────────────

export function buildHistoricalSummary(data: QualityData): { historicalSummary: HistoricalYear[]; revCagr3yr: number } {
  const { incomeStatements, balanceSheets, cashFlows } = data;
  const years = Math.min(incomeStatements.length, 5);

  const revs = incomeStatements.slice(0, years).map((ic: any) => parseNum(ic.revenue));
  let revCagr3yr = 0;
  if (revs.length >= 4 && revs[3] > 0 && revs[0] > 0) {
    revCagr3yr = Math.pow(revs[0] / revs[3], 1 / 3) - 1;
  }

  const historicalSummary: HistoricalYear[] = incomeStatements.slice(0, years).map((ic: any, i: number, arr: any[]) => {
    const bs = balanceSheets[i];
    const cf = cashFlows[i];
    const prevIc = i < arr.length - 1 ? arr[i + 1] : undefined;

    const rev = parseNum(ic.revenue);
    const prevRev = prevIc ? parseNum(prevIc.revenue) : 0;
    const revGrowth = prevRev > 0 ? (rev - prevRev) / prevRev : 0;

    const cogs = parseNum(ic.costOfRevenue);
    const gp = parseNum(ic.grossProfit);
    const ebit = parseNum(ic.operatingIncome);
    const dna = parseNum(ic.depreciationAndAmortization) || parseNum(cf?.depreciationAndAmortization);
    const ebitda = parseNum(ic.ebitda) || (ebit + dna);
    const netIncome = parseNum(ic.netIncome);
    const eps = parseNum(ic.eps);
    const interestExpense = Math.abs(parseNum(ic.interestExpense));

    const totalAssets = parseNum(bs?.totalAssets);
    const currentAssets = parseNum(bs?.totalCurrentAssets);
    const currentLiabilities = parseNum(bs?.totalCurrentLiabilities);
    const inventory = parseNum(bs?.inventory);
    const totalEquity = parseNum(bs?.totalStockholdersEquity);
    const shortTermDebt = parseNum(bs?.shortTermDebt);
    const longTermDebt = parseNum(bs?.longTermDebt);
    const totalDebt = parseNum(bs?.totalDebt) || (shortTermDebt + longTermDebt);
    const netReceivables = parseNum(bs?.netReceivables);
    const accountsPayable = parseNum(bs?.accountPayables);
    const retainedEarnings = parseNum(bs?.retainedEarnings);
    const totalLiabilities = parseNum(bs?.totalLiabilities) || (totalAssets - totalEquity);
    const shares = parseNum(ic.weightedAverageShsOut);

    const cfo = parseNum(cf?.operatingCashFlow);
    const capex = Math.abs(parseNum(cf?.capitalExpenditure));

    const isDebtFree = totalDebt < 1;
    const currentRatio = currentLiabilities ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities ? (currentAssets - inventory) / currentLiabilities : 0;
    const interestCoverage = interestExpense ? ebit / interestExpense : (isDebtFree ? 0 : 0);
    const debtToEquity = totalEquity ? totalDebt / totalEquity : 0;
    const roe = totalEquity ? netIncome / totalEquity : 0;
    const roa = totalAssets ? netIncome / totalAssets : 0;

    const prevEps = prevIc ? parseNum(prevIc.eps) : null;
    const epsGrowth: number | null = (prevEps !== null && Math.abs(prevEps) > 0.001)
      ? (eps - prevEps) / Math.abs(prevEps) : null;

    const yearStr = ic.fiscalYear || (ic.date ? ic.date.substring(0, 4) : '');

    return {
      year: yearStr, rev, revGrowth, gp, cogs,
      grossMargin: rev ? gp / rev : 0,
      ebitda, ebitdaMargin: rev ? ebitda / rev : 0,
      netIncome, netProfitMargin: rev ? netIncome / rev : 0,
      eps, epsGrowth, currentRatio, quickRatio, interestCoverage, debtToEquity, roe, roa, cfo, capex,
      ebit, totalAssets, totalEquity, currentAssets, currentLiabilities,
      longTermDebt, shares, netReceivables, accountsPayable: accountsPayable, retainedEarnings, totalLiabilities,
      inventory,
    };
  }).slice(0, 5).reverse();

  return { historicalSummary, revCagr3yr };
}

// ─── Multi-year composite grades ───────────────────────────────────────────────

export function computeGrades(historicalSummary: HistoricalYear[], revCagr3yr: number): GradeResult | null {
  const hist = historicalSummary;
  const recent = hist.slice(-3);
  if (recent.length === 0) return null;

  const isDebtFree = recent.every(y => y.debtToEquity < 0.01);

  const avgCurr = safeAvg(recent.map(y => y.currentRatio));
  const avgQuick = safeAvg(recent.map(y => y.quickRatio));
  const avgDE = safeAvg(recent.map(y => y.debtToEquity));
  const avgIntCov = safeAvg(recent.map(y => y.interestCoverage));
  const effectiveIntCovGrade: LetterGrade = (isDebtFree && avgIntCov === 0) ? 'A' : gradeIntCoverage(avgIntCov);

  const healthMetrics: MetricResult[] = [
    { name: 'Current Ratio', value: avgCurr, formattedValue: avgCurr.toFixed(2) + 'x', grade: gradeCurrRatio(avgCurr), trend: detectTrend(recent.map(y => y.currentRatio)) },
    { name: 'Quick Ratio', value: avgQuick, formattedValue: avgQuick.toFixed(2) + 'x', grade: gradeQuickRatio(avgQuick), trend: detectTrend(recent.map(y => y.quickRatio)) },
    { name: 'Debt / Equity', value: avgDE, formattedValue: avgDE.toFixed(2) + 'x', grade: gradeDebtToEquity(avgDE), trend: detectTrendInverted(recent.map(y => y.debtToEquity)) },
    { name: 'Interest Coverage', value: avgIntCov, formattedValue: (isDebtFree && avgIntCov === 0) ? '\u221E' : avgIntCov.toFixed(1) + 'x', grade: effectiveIntCovGrade, trend: isDebtFree ? 'stable' : detectTrend(recent.map(y => y.interestCoverage)) },
  ];
  const healthScore = safeAvg(healthMetrics.map(m => gradeToScore(m.grade)));

  const avgGross = safeAvg(recent.map(y => y.grossMargin));
  const avgEbitda = safeAvg(recent.map(y => y.ebitdaMargin));
  const avgNet = safeAvg(recent.map(y => y.netProfitMargin));
  const avgROE = safeAvg(recent.map(y => y.roe));
  const avgROA = safeAvg(recent.map(y => y.roa));

  const profMetrics: MetricResult[] = [
    { name: 'Gross Margin', value: avgGross, formattedValue: (avgGross * 100).toFixed(1) + '%', grade: gradeGrossMargin(avgGross), trend: detectTrend(recent.map(y => y.grossMargin)) },
    { name: 'EBITDA Margin', value: avgEbitda, formattedValue: (avgEbitda * 100).toFixed(1) + '%', grade: gradeEbitdaMargin(avgEbitda), trend: detectTrend(recent.map(y => y.ebitdaMargin)) },
    { name: 'Net Profit Margin', value: avgNet, formattedValue: (avgNet * 100).toFixed(1) + '%', grade: gradeNetMargin(avgNet), trend: detectTrend(recent.map(y => y.netProfitMargin)) },
    { name: 'ROE', value: avgROE, formattedValue: (avgROE * 100).toFixed(1) + '%', grade: gradeROE(avgROE), trend: detectTrend(recent.map(y => y.roe)) },
    { name: 'ROA', value: avgROA, formattedValue: (avgROA * 100).toFixed(1) + '%', grade: gradeROA(avgROA), trend: detectTrend(recent.map(y => y.roa)) },
  ];
  const profScore = safeAvg(profMetrics.map(m => gradeToScore(m.grade)));

  const avgRevGrowth = safeAvg(recent.map(y => y.revGrowth));
  const epsRates: number[] = [];
  for (let i = 1; i < hist.length; i++) {
    const prev = hist[i - 1].eps;
    const curr = hist[i].eps;
    if (Math.abs(prev) > 0.001) epsRates.push((curr - prev) / Math.abs(prev));
  }
  const recentEpsRates = epsRates.slice(-3);
  const avgEpsGrowth = safeAvg(recentEpsRates);

  const growthMetrics: MetricResult[] = [
    { name: 'Rev Growth (3yr Avg)', value: avgRevGrowth, formattedValue: (avgRevGrowth * 100).toFixed(1) + '%', grade: gradeRevGrowth(avgRevGrowth), trend: detectTrend(recent.map(y => y.revGrowth)) },
    { name: 'Rev CAGR (3yr)', value: revCagr3yr, formattedValue: (revCagr3yr * 100).toFixed(1) + '%', grade: gradeRevGrowth(revCagr3yr), trend: 'stable' },
    { name: 'EPS Growth (3yr Avg)', value: avgEpsGrowth, formattedValue: (avgEpsGrowth * 100).toFixed(1) + '%', grade: gradeEpsGrowth(avgEpsGrowth), trend: detectTrend(recentEpsRates) },
  ];
  const growthScore = safeAvg(growthMetrics.map(m => gradeToScore(m.grade)));

  const fcfArr = recent.map(y => y.cfo - y.capex);
  const fcfMargins = recent.map((y, i) => safeDivide(fcfArr[i], y.rev));
  const cfoMargins = recent.map(y => safeDivide(y.cfo, y.rev));
  const fcfConvArr = recent
    .map((y, i) => (y.netIncome > 0 ? safeDivide(fcfArr[i], y.netIncome) : null))
    .filter((v): v is number => v !== null);

  const avgFcfMargin = safeAvg(fcfMargins);
  const avgFcfConv = safeAvg(fcfConvArr);
  const avgCfoMargin = safeAvg(cfoMargins);

  const cfMetrics: MetricResult[] = [
    { name: 'FCF Margin', value: avgFcfMargin, formattedValue: (avgFcfMargin * 100).toFixed(1) + '%', grade: gradeFcfMargin(avgFcfMargin), trend: detectTrend(fcfMargins) },
    { name: 'FCF Conversion', value: avgFcfConv, formattedValue: fcfConvArr.length === 0 ? 'N/A' : (avgFcfConv * 100).toFixed(0) + '%', grade: fcfConvArr.length === 0 ? 'D' : gradeFcfConv(avgFcfConv), trend: detectTrend(fcfConvArr) },
    { name: 'CFO Margin', value: avgCfoMargin, formattedValue: (avgCfoMargin * 100).toFixed(1) + '%', grade: gradeCfoMargin(avgCfoMargin), trend: detectTrend(cfoMargins) },
  ];
  const cfScore = safeAvg(cfMetrics.map(m => gradeToScore(m.grade)));

  const weightedScore = healthScore * 0.25 + profScore * 0.30 + growthScore * 0.25 + cfScore * 0.20;
  const overallGrade = scoreToGrade(weightedScore);
  const overallScore = scoreTo100(weightedScore);
  const healthGrade = scoreToGrade(healthScore);
  const profGrade = scoreToGrade(profScore);
  const growthGrade = scoreToGrade(growthScore);
  const cfGrade = scoreToGrade(cfScore);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (healthGrade === 'A' || healthGrade === 'B') strengths.push('strong balance sheet');
  else if (healthGrade === 'D') weaknesses.push('weak financial health');
  if (profGrade === 'A' || profGrade === 'B') strengths.push('high profitability');
  else if (profGrade === 'D') weaknesses.push('poor profitability');
  if (growthGrade === 'A' || growthGrade === 'B') strengths.push('solid revenue growth');
  else if (growthGrade === 'D') weaknesses.push('declining growth');
  if (cfGrade === 'A' || cfGrade === 'B') strengths.push('robust cash generation');
  else if (cfGrade === 'D') weaknesses.push('weak cash conversion');
  const descriptor = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor' }[overallGrade];
  let summary = `${descriptor} overall financial profile across all categories.`;
  if (strengths.length > 0 && weaknesses.length === 0) summary = `${descriptor} overall with ${strengths.join(' and ')}.`;
  else if (weaknesses.length > 0 && strengths.length === 0) summary = `Faces challenges with ${weaknesses.join(' and ')}.`;
  else if (strengths.length > 0 && weaknesses.length > 0) summary = `Shows ${strengths[0]} but faces ${weaknesses[0]}.`;

  return {
    rawCategories: [
      { name: 'Financial Health', iconKey: 'shield', weight: 25, grade: healthGrade, score: healthScore, metrics: healthMetrics },
      { name: 'Profitability', iconKey: 'dollar', weight: 30, grade: profGrade, score: profScore, metrics: profMetrics },
      { name: 'Growth', iconKey: 'trend', weight: 25, grade: growthGrade, score: growthScore, metrics: growthMetrics },
      { name: 'Cash Flow Quality', iconKey: 'activity', weight: 20, grade: cfGrade, score: cfScore, metrics: cfMetrics },
    ],
    overallGrade, overallScore, summary,
  };
}

// ─── Single-year grades (for YoY trend table) ─────────────────────────────────

export function computeSingleYearGrades(y: HistoricalYear): YearGrade {
  const isDebtFree = y.debtToEquity < 0.01;
  const intCovGrade: LetterGrade = (isDebtFree && y.interestCoverage === 0) ? 'A' : gradeIntCoverage(y.interestCoverage);

  const healthScore = safeAvg([
    gradeToScore(gradeCurrRatio(y.currentRatio)),
    gradeToScore(gradeQuickRatio(y.quickRatio)),
    gradeToScore(gradeDebtToEquity(y.debtToEquity)),
    gradeToScore(intCovGrade),
  ]);

  const profScore = safeAvg([
    gradeToScore(gradeGrossMargin(y.grossMargin)),
    gradeToScore(gradeEbitdaMargin(y.ebitdaMargin)),
    gradeToScore(gradeNetMargin(y.netProfitMargin)),
    gradeToScore(gradeROE(y.roe)),
    gradeToScore(gradeROA(y.roa)),
  ]);

  const growthVals = [gradeToScore(gradeRevGrowth(y.revGrowth))];
  if (y.epsGrowth !== null && isFinite(y.epsGrowth) && !isNaN(y.epsGrowth)) {
    growthVals.push(gradeToScore(gradeEpsGrowth(y.epsGrowth)));
  }
  const growthScore = safeAvg(growthVals);

  const fcf = y.cfo - y.capex;
  const fcfMargin = y.rev ? fcf / y.rev : 0;
  const cfoMargin = y.rev ? y.cfo / y.rev : 0;
  const cfVals = [gradeToScore(gradeFcfMargin(fcfMargin)), gradeToScore(gradeCfoMargin(cfoMargin))];
  if (y.netIncome > 0) cfVals.push(gradeToScore(gradeFcfConv(y.netIncome ? fcf / y.netIncome : 0)));
  const cfScore = safeAvg(cfVals);

  const weighted = healthScore * 0.25 + profScore * 0.30 + growthScore * 0.25 + cfScore * 0.20;
  return {
    year: String(y.year).substring(0, 4),
    health: scoreToGrade(healthScore),
    prof: scoreToGrade(profScore),
    growth: scoreToGrade(growthScore),
    cf: scoreToGrade(cfScore),
    overall: scoreToGrade(weighted),
    score: scoreTo100(weighted),
  };
}

// ─── Altman Z-Score ────────────────────────────────────────────────────────────

export function computeAltmanZ(y: HistoricalYear, marketCapM: number): AltmanZResult | null {
  if (!y.totalAssets || y.totalAssets === 0) return null;
  const TA = y.totalAssets;
  const wc = y.currentAssets - y.currentLiabilities;
  const RE = y.retainedEarnings || y.totalEquity;
  const TL = y.totalLiabilities || (TA - y.totalEquity);
  const X1 = wc / TA;
  const X2 = RE / TA;
  const X3 = y.ebit / TA;
  const X4 = TL > 0 ? (marketCapM * 1e6) / TL : 5;
  const X5 = y.rev / TA;
  const z = 1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * X4 + 1.0 * X5;
  if (!isFinite(z) || isNaN(z)) return null;
  const zone: 'safe' | 'grey' | 'distress' = z > 2.99 ? 'safe' : z >= 1.81 ? 'grey' : 'distress';
  return { z, zone };
}

// ─── Piotroski F-Score ─────────────────────────────────────────────────────────

export function computePiotroski(hist: HistoricalYear[]): PiotroskiResult | null {
  if (hist.length < 2) return null;
  const curr = hist[hist.length - 1];
  const prev = hist[hist.length - 2];
  if (!curr.totalAssets || !prev.totalAssets) return null;

  const signals = [
    { name: 'Positive Net Income', passed: curr.netIncome > 0, detail: `Net income: $${(curr.netIncome / 1e6).toFixed(0)}M` },
    { name: 'Positive Operating Cash Flow', passed: curr.cfo > 0, detail: `OCF: $${(curr.cfo / 1e6).toFixed(0)}M` },
    { name: 'Rising ROA', passed: curr.roa > prev.roa, detail: `${(prev.roa * 100).toFixed(1)}% -> ${(curr.roa * 100).toFixed(1)}%` },
    { name: 'Accruals Quality (CFO > NI)', passed: curr.cfo > curr.netIncome, detail: curr.cfo > curr.netIncome ? 'Cash earnings exceed accrual earnings' : 'Accrual earnings exceed cash' },
    { name: 'Declining LT Debt / Assets', passed: (curr.longTermDebt / curr.totalAssets) <= (prev.longTermDebt / prev.totalAssets) + 0.001, detail: `${((prev.longTermDebt / prev.totalAssets) * 100).toFixed(1)}% -> ${((curr.longTermDebt / curr.totalAssets) * 100).toFixed(1)}%` },
    { name: 'Rising Current Ratio', passed: curr.currentRatio >= prev.currentRatio - 0.01, detail: `${prev.currentRatio.toFixed(2)}x -> ${curr.currentRatio.toFixed(2)}x` },
    { name: 'No Share Dilution', passed: !curr.shares || !prev.shares || curr.shares <= prev.shares * 1.01, detail: curr.shares && prev.shares ? `${(prev.shares / 1e6).toFixed(0)}M -> ${(curr.shares / 1e6).toFixed(0)}M shares` : 'N/A' },
    { name: 'Rising Gross Margin', passed: curr.grossMargin >= prev.grossMargin - 0.001, detail: `${(prev.grossMargin * 100).toFixed(1)}% -> ${(curr.grossMargin * 100).toFixed(1)}%` },
    { name: 'Rising Asset Turnover', passed: (curr.rev / curr.totalAssets) >= (prev.rev / prev.totalAssets) - 0.001, detail: `${(prev.rev / prev.totalAssets).toFixed(2)}x -> ${(curr.rev / curr.totalAssets).toFixed(2)}x` },
  ];

  return { score: signals.filter(s => s.passed).length, signals };
}

// ─── DuPont ROE Decomposition ──────────────────────────────────────────────────

export function computeDuPont(hist: HistoricalYear[]): DuPontYear[] {
  return hist.map(y => ({
    year: String(y.year).substring(0, 4),
    netMargin: y.rev ? y.netIncome / y.rev : 0,
    assetTurnover: y.totalAssets ? y.rev / y.totalAssets : 0,
    equityMultiplier: y.totalEquity ? y.totalAssets / y.totalEquity : 0,
    roe: y.totalEquity ? y.netIncome / y.totalEquity : 0,
  }));
}

// ─── Working Capital Efficiency ────────────────────────────────────────────────

export function computeWorkingCapital(hist: HistoricalYear[]): WorkingCapitalYear[] {
  return hist.map(y => {
    const dso = y.rev ? (y.netReceivables / y.rev) * 365 : null;
    const dio = y.cogs ? ((y.inventory || 0) / y.cogs) * 365 : null;
    const dpo = y.cogs ? (y.accountsPayable / y.cogs) * 365 : null;
    const ccc = (dso != null && dio != null && dpo != null) ? dso + dio - dpo : null;
    return { year: String(y.year).substring(0, 4), dso, dio, dpo, ccc };
  });
}

// ─── Earnings Quality (Accruals Ratio) ─────────────────────────────────────────

export function computeEarningsQuality(hist: HistoricalYear[]): EarningsQualityResult | null {
  if (hist.length === 0) return null;
  const trend = hist.map(y => ({
    year: String(y.year).substring(0, 4),
    accruals: y.totalAssets ? (y.netIncome - y.cfo) / y.totalAssets : 0,
  }));
  const latest = trend[trend.length - 1].accruals;
  let score: number;
  let label: string;
  if (latest < -0.10) { score = 95; label = 'Excellent'; }
  else if (latest < -0.03) { score = 75; label = 'Good'; }
  else if (latest < 0.05) { score = 50; label = 'Fair'; }
  else { score = 25; label = 'Poor'; }
  const interpretation = latest < -0.03
    ? 'Earnings are well-supported by cash flows.'
    : latest < 0.05
      ? 'Moderate accruals — earnings quality is acceptable.'
      : 'High accruals relative to assets — earnings may not be cash-backed.';
  return { score, label, trend, interpretation, latest };
}

// ─── Risk Flags ────────────────────────────────────────────────────────────────

export function computeRiskFlags(hist: HistoricalYear[]): string[] {
  const flags: string[] = [];
  const recent = hist.slice(-3);
  if (recent.length === 0) return flags;
  const latest = recent[recent.length - 1];
  const isDebtFree = recent.every(y => y.debtToEquity < 0.01);

  const fcfNegCount = recent.filter(y => (y.cfo - y.capex) < 0).length;
  if (fcfNegCount >= 2) flags.push('FCF negative in 2+ of last 3 years');

  if (recent.length >= 2) {
    const firstRev = recent[0].rev;
    const lastRev = latest.rev;
    if (firstRev > 0 && lastRev < firstRev * 0.97) flags.push('Revenue in decline');
  }

  if (recent.length >= 3) {
    const gms = recent.map(y => y.grossMargin);
    if (gms[2] < gms[1] && gms[1] < gms[0]) flags.push('Gross margin compressing 3 consecutive years');
  }

  if (recent.length >= 2) {
    const debtRising = latest.debtToEquity > recent[0].debtToEquity * 1.2;
    const marginsCompressing = latest.ebitdaMargin < recent[0].ebitdaMargin * 0.9;
    if (debtRising && marginsCompressing) flags.push('Debt rising with compressing EBITDA margins');
  }

  if (!isDebtFree && latest.interestCoverage > 0 && latest.interestCoverage < 2)
    flags.push('Interest coverage below 2x');
  if (latest.currentRatio > 0 && latest.currentRatio < 1.0) flags.push('Current ratio below 1x');
  if (latest.netIncome < 0) flags.push('Net income negative');
  if (latest.debtToEquity > 3) flags.push('High leverage (D/E > 3x)');

  return flags;
}

// ─── Grading threshold descriptions (for tooltip display) ─────────────────────

export const METRIC_THRESHOLDS: Record<string, string> = {
  'Current Ratio':        'A >= 2.0 · B >= 1.5 · C >= 1.0 · D < 1.0',
  'Quick Ratio':          'A >= 1.5 · B >= 1.0 · C >= 0.7 · D < 0.7',
  'Debt / Equity':        'A <= 0.3 · B <= 0.7 · C <= 1.5 · D > 1.5',
  'Interest Coverage':    'A >= 10x · B >= 5x · C >= 2x · D < 2x',
  'Gross Margin':         'A >= 60% · B >= 40% · C >= 20% · D < 20%',
  'EBITDA Margin':        'A >= 30% · B >= 20% · C >= 10% · D < 10%',
  'Net Profit Margin':    'A >= 20% · B >= 10% · C >= 5% · D < 5%',
  'ROE':                  'A >= 20% · B >= 12% · C >= 5% · D < 5%',
  'ROA':                  'A >= 10% · B >= 5% · C >= 2% · D < 2%',
  'Rev Growth (3yr Avg)': 'A >= 15% · B >= 8% · C >= 3% · D < 3%',
  'Rev CAGR (3yr)':       'A >= 15% · B >= 8% · C >= 3% · D < 3%',
  'EPS Growth (3yr Avg)': 'A >= 15% · B >= 8% · C >= 3% · D < 3%',
  'FCF Margin':           'A >= 15% · B >= 8% · C >= 3% · D < 3%',
  'FCF Conversion':       'A >= 100% · B >= 60% · C >= 20% · D < 20%',
  'CFO Margin':           'A >= 20% · B >= 12% · C >= 5% · D < 5%',
};
