import { parseNum } from './utils/formatters';
import type {
  FinancialData, DCFInputs, DCFResult,
  FMPIncomeStatement, FMPBalanceSheet, FMPCashFlow,
} from './types';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}

function computeAvailableCagr(values: number[], targetYears: number) {
  if (values.length < 2 || values[0] <= 0) return 0;
  const maxYears = Math.min(targetYears, values.length - 1);
  for (let years = maxYears; years >= 1; years -= 1) {
    if (values[years] > 0) {
      return Math.pow(values[0] / values[years], 1 / years) - 1;
    }
  }
  return 0;
}

function n(val: unknown): number {
  return parseNum(val) || 0;
}

function getYearLabel(ic: FMPIncomeStatement): string {
  if (ic.fiscalYear) return ic.fiscalYear;
  if (ic.date) return ic.date.substring(0, 4);
  return '';
}

function isFinancialSector(profile: any): boolean {
  const industry = (profile?.finnhubIndustry || '').toLowerCase();
  return (
    industry.includes('bank') ||
    industry.includes('insurance') ||
    industry.includes('financial') ||
    industry.includes('capital markets') ||
    industry.includes('asset management')
  );
}

function getWorkingCapital(bs: FMPBalanceSheet | undefined) {
  if (!bs) return { receivables: 0, inventory: 0, payables: 0, value: 0 };
  const receivables = n(bs.netReceivables);
  const inventory = n(bs.inventory);
  const payables = n(bs.accountPayables);
  return {
    receivables,
    inventory,
    payables,
    value: (receivables + inventory) - payables,
  };
}

function buildHistoricalYear(
  ic: FMPIncomeStatement,
  bs: FMPBalanceSheet | undefined,
  cf: FMPCashFlow | undefined,
  prevIc: FMPIncomeStatement | undefined,
  prevBs: FMPBalanceSheet | undefined,
) {
  const rev = n(ic.revenue);
  const prevRev = prevIc ? n(prevIc.revenue) : 0;
  const revGrowth = prevRev > 0 ? (rev - prevRev) / prevRev : 0;

  const gp = n(ic.grossProfit);
  const cogs = n(ic.costOfRevenue);
  const sga = n(ic.sellingGeneralAndAdministrativeExpenses);
  const rd = n(ic.researchAndDevelopmentExpenses);
  const otherExpenses = n(ic.otherExpenses);
  const operatingExpenses = n(ic.operatingExpenses);
  const ebit = n(ic.operatingIncome);
  const dna = n(ic.depreciationAndAmortization) || n(cf?.depreciationAndAmortization);
  const ebitda = n(ic.ebitda) || (ebit + dna);
  const interestIncome = n(ic.interestIncome);
  const interestExpense = Math.abs(n(ic.interestExpense));
  const incomeBeforeTax = n(ic.incomeBeforeTax);
  const tax = n(ic.incomeTaxExpense);
  const netIncome = n(ic.netIncome);
  const eps = n(ic.eps);
  const epsDiluted = n(ic.epsDiluted);
  const shares = n(ic.weightedAverageShsOut);
  const sharesDiluted = n(ic.weightedAverageShsOutDil);

  const cashAndCashEquivalents = n(bs?.cashAndCashEquivalents);
  const shortTermInvestments = n(bs?.shortTermInvestments);
  const cashAndShortTermInvestments = n(bs?.cashAndShortTermInvestments);
  const netReceivables = n(bs?.netReceivables);
  const bsInventory = n(bs?.inventory);
  const otherCurrentAssets = n(bs?.otherCurrentAssets);
  const totalCurrentAssets = n(bs?.totalCurrentAssets);
  const ppNet = n(bs?.propertyPlantEquipmentNet);
  const goodwill = n(bs?.goodwill);
  const intangibleAssets = n(bs?.intangibleAssets);
  const longTermInvestments = n(bs?.longTermInvestments);
  const totalNonCurrentAssets = n(bs?.totalNonCurrentAssets);
  const totalAssets = n(bs?.totalAssets);
  const accountPayables = n(bs?.accountPayables);
  const shortTermDebt = n(bs?.shortTermDebt);
  const deferredRevenue = n(bs?.deferredRevenue);
  const otherCurrentLiabilities = n(bs?.otherCurrentLiabilities);
  const totalCurrentLiabilities = n(bs?.totalCurrentLiabilities);
  const longTermDebt = n(bs?.longTermDebt);
  const totalNonCurrentLiabilities = n(bs?.totalNonCurrentLiabilities);
  const totalLiabilities = n(bs?.totalLiabilities);
  const totalStockholdersEquity = n(bs?.totalStockholdersEquity);
  const totalEquity = n(bs?.totalEquity);
  const totalDebt = n(bs?.totalDebt) || (shortTermDebt + longTermDebt);
  const netDebt = n(bs?.netDebt);

  const wc = getWorkingCapital(bs);
  const prevWc = getWorkingCapital(prevBs);

  const capex = Math.abs(n(cf?.capitalExpenditure));
  const cfo = n(cf?.operatingCashFlow);
  const cfi = n(cf?.netCashProvidedByInvestingActivities);
  const cff = n(cf?.netCashProvidedByFinancingActivities);
  const dividendsPaid = Math.abs(n(cf?.commonDividendsPaid) || n(cf?.netDividendsPaid));
  const debtRepayment = Math.abs(Math.min(0, n(cf?.longTermNetDebtIssuance)));
  const changeInCash = n(cf?.netChangeInCash);
  const freeCashFlow = n(cf?.freeCashFlow);
  const stockBasedCompensation = n(cf?.stockBasedCompensation);
  const changeInWorkingCapital = n(cf?.changeInWorkingCapital);
  const acquisitionsNet = n(cf?.acquisitionsNet);
  const purchasesOfInvestments = n(cf?.purchasesOfInvestments);
  const salesMaturitiesOfInvestments = n(cf?.salesMaturitiesOfInvestments);
  const commonStockRepurchased = n(cf?.commonStockRepurchased);
  const cfNetIncome = n(cf?.netIncome);
  const cfDna = n(cf?.depreciationAndAmortization);

  const ebiat = ebit - tax;
  const deltaWc = prevBs ? wc.value - prevWc.value : 0;
  const fcff = ebiat + dna - capex - deltaWc;

  return {
    year: getYearLabel(ic),
    // Income Statement
    rev,
    revGrowth,
    cogs,
    gp,
    gpm: rev ? gp / rev : 0,
    rd,
    sga,
    otherExpenses,
    operatingExpenses,
    ebit,
    ebitMargin: rev ? ebit / rev : 0,
    dna,
    ebitda,
    ebitdaMargin: rev ? ebitda / rev : 0,
    interestIncome,
    interestExpense,
    incomeBeforeTax,
    tax,
    netIncome,
    netProfitMargin: rev ? netIncome / rev : 0,
    eps,
    epsDiluted,
    shares,
    sharesDiluted,
    // Balance Sheet
    cashAndCashEquivalents,
    shortTermInvestments,
    cashAndShortTermInvestments,
    netReceivables,
    inventory: bsInventory,
    otherCurrentAssets,
    totalCurrentAssets,
    ppNet,
    goodwill,
    intangibleAssets,
    longTermInvestments,
    totalNonCurrentAssets,
    totalAssets,
    accountPayables,
    shortTermDebt,
    deferredRevenue,
    otherCurrentLiabilities,
    totalCurrentLiabilities,
    longTermDebt,
    totalNonCurrentLiabilities,
    totalLiabilities,
    totalStockholdersEquity,
    totalEquity,
    totalDebt,
    netDebt,
    cash: cashAndCashEquivalents,
    wc: wc.value,
    // Cash Flow
    cfNetIncome,
    cfDna,
    stockBasedCompensation,
    changeInWorkingCapital,
    cfo,
    capex,
    acquisitionsNet,
    purchasesOfInvestments,
    salesMaturitiesOfInvestments,
    cfi,
    debtRepayment,
    commonStockRepurchased,
    dividendsPaid,
    cff,
    freeCashFlow,
    changeInCash,
    // Derived ratios
    currentRatio: totalCurrentLiabilities ? totalCurrentAssets / totalCurrentLiabilities : 0,
    quickRatio: totalCurrentLiabilities ? (totalCurrentAssets - bsInventory) / totalCurrentLiabilities : 0,
    interestCoverage: interestExpense ? ebit / interestExpense : 0,
    debtToEquity: totalEquity ? totalDebt / totalEquity : 0,
    roe: totalEquity ? netIncome / totalEquity : 0,
    roa: totalAssets ? netIncome / totalAssets : 0,
    grossMargin: rev ? gp / rev : 0,
    profitMargin: rev ? netIncome / rev : 0,
    taxRate: ebit > 0 ? tax / ebit : 0,
    ebiat,
    deltaWc,
    fcff,
  };
}

export function computeDCF(data: FinancialData, inputs: DCFInputs): DCFResult {
  const {
    revGrowthStart, revGrowthEnd, ebitMarginStart, ebitMarginEnd,
    termGrowth, waccAdj, erp,
    dnaMarginProj, wcMarginProj, capexMarginProj, sharesGrowthProj, forecastYears,
  } = inputs;

  const { incomeStatements, balanceSheets, cashFlows, profile, metrics } = data;

  if (!incomeStatements || incomeStatements.length === 0) {
    throw new Error('No financial data');
  }
  if (!Number.isFinite(forecastYears) || forecastYears < 1) {
    throw new Error('Forecast years must be at least 1.');
  }

  const warnings: string[] = [];
  const isFinancial = isFinancialSector(profile);
  if (isFinancial) {
    warnings.push('Financial-sector company detected. DCF model may be less reliable for banks/insurance firms.');
  }

  const years = Math.min(incomeStatements.length, 5);

  const revs = incomeStatements.slice(0, years).map(ic => n(ic.revenue));
  const revCagr3yr = computeAvailableCagr(revs, 3);
  const revCagr5yr = computeAvailableCagr(revs, 5);

  const historicalRows = incomeStatements.slice(0, years).map((ic, i, arr) => {
    const bs = balanceSheets[i];
    const cf = cashFlows[i];
    const prevIc = i < arr.length - 1 ? arr[i + 1] : undefined;
    const prevBs = i < balanceSheets.length - 1 ? balanceSheets[i + 1] : undefined;
    return buildHistoricalYear(ic, bs, cf, prevIc, prevBs);
  });

  const historicalSummary = historicalRows.slice(0, 5).reverse();

  const maxEbitMargin5yr = historicalSummary.length > 0
    ? Math.max(...historicalSummary.map(y => y.ebitMargin))
    : 0;

  const taxRates = incomeStatements.slice(0, 5).map(ic => {
    const tax = n(ic.incomeTaxExpense);
    const pretax = n(ic.incomeBeforeTax);
    if (pretax <= 0) return null;
    return clamp(tax / pretax, 0, 0.5);
  }).filter((v): v is number => v != null);
  const avgTaxRate = taxRates.length > 0 ? average(taxRates) : 0.21;

  const dnaMargins = incomeStatements.slice(0, 5).map((ic, i) => {
    const rev = n(ic.revenue);
    const dna = n(ic.depreciationAndAmortization) || n(cashFlows[i]?.depreciationAndAmortization);
    return rev > 0 ? dna / rev : 0;
  });
  const avgDnaMargin5yr = average(dnaMargins);
  const avgDnaMargin3yr = average(dnaMargins.slice(0, Math.min(dnaMargins.length, 3)));

  const nwcMargins = balanceSheets.slice(0, 5).map((bs, i) => {
    const rev = n(incomeStatements[i]?.revenue);
    const wc = getWorkingCapital(bs).value;
    return rev > 0 ? wc / rev : 0;
  });
  const avgNwcMargin5yr = average(nwcMargins);
  const avgNwcMargin3yr = average(nwcMargins.slice(0, Math.min(nwcMargins.length, 3)));

  const capexMargins = cashFlows.slice(0, 5).map((cf, i) => {
    const rev = n(incomeStatements[i]?.revenue);
    const capex = Math.abs(n(cf.capitalExpenditure));
    return rev > 0 ? capex / rev : 0;
  });
  const avgCapexMargin5yr = average(capexMargins);
  const avgCapexMargin3yr = average(capexMargins.slice(0, Math.min(capexMargins.length, 3)));

  const sharesVals = incomeStatements.slice(0, 5).map(ic => n(ic.weightedAverageShsOut));
  const sharesCagr5yr = computeAvailableCagr(sharesVals, 5);
  const sharesCagr3yr = computeAvailableCagr(sharesVals, 3);

  const latestIc = incomeStatements[0];
  const latestBs = balanceSheets[0];
  const latestCf = cashFlows[0];

  const baseRev = n(latestIc.revenue);
  const baseEbit = n(latestIc.operatingIncome);
  const ebitMargin = baseRev !== 0 ? baseEbit / baseRev : 0;
  const baseWc = getWorkingCapital(latestBs).value;

  if (baseRev <= 0) {
    throw new Error('Revenue is zero or negative in the latest financials. The DCF model cannot be estimated reliably for this ticker.');
  }

  const beta = parseNum(metrics?.beta) || 1.0;
  const rf = 0.04;
  const ke = rf + beta * (erp / 100);

  const totalDebt = n(latestBs?.totalDebt) || (n(latestBs?.shortTermDebt) + n(latestBs?.longTermDebt));
  const interestExpense = Math.abs(n(latestIc.interestExpense));
  const kd = totalDebt !== 0 ? interestExpense / totalDebt : 0;

  const marketCap = parseNum(profile?.marketCapitalization) * 1e6 || parseNum(metrics?.marketCapitalization) * 1e6;
  const totalValue = marketCap + totalDebt;
  const wEquity = totalValue !== 0 ? marketCap / totalValue : 1;
  const wDebt = totalValue !== 0 ? totalDebt / totalValue : 0;

  const rawWacc = wEquity * ke + wDebt * kd * (1 - avgTaxRate);
  const baseWacc = Math.max(rawWacc, 0.06);
  const wacc = Math.max(baseWacc + (waccAdj / 100), (termGrowth / 100) + 0.02);

  const profileShares = parseNum(profile?.shareOutstanding) * 1e6;
  const sharesOut = profileShares > 0 ? profileShares : n(latestIc.weightedAverageShsOut);

  if (sharesOut <= 0) {
    throw new Error('Unable to determine current shares outstanding.');
  }

  const currentPrice = sharesOut > 0 && marketCap > 0 ? marketCap / sharesOut : 0;

  const projections = [];
  let prevRev = baseRev;
  let prevWc = baseWc;
  let prevShares = sharesOut;

  const lastHistYearStr = historicalSummary.length > 0
    ? historicalSummary[historicalSummary.length - 1].year
    : new Date().getFullYear().toString();
  const lastYearNum = parseInt(lastHistYearStr.substring(0, 4));

  const currentMonth = new Date().getMonth() + 1;
  const fractionOfYear = Math.max((13 - currentMonth) / 12, 1 / 12);

  for (let i = 1; i <= forecastYears; i++) {
    const projYear = lastYearNum + i;
    const yearGrowth = forecastYears <= 1
      ? revGrowthStart
      : revGrowthStart + (revGrowthEnd - revGrowthStart) * (i - 1) / (forecastYears - 1);
    const rev = prevRev * (1 + yearGrowth / 100);
    const shares = prevShares * (1 + sharesGrowthProj / 100);
    const yearEbitMargin = forecastYears <= 1
      ? ebitMarginStart / 100
      : (ebitMarginStart + (ebitMarginEnd - ebitMarginStart) * (i - 1) / (forecastYears - 1)) / 100;
    const ebit = rev * yearEbitMargin;
    const tax = ebit * avgTaxRate;
    const ebiat = ebit - tax;
    const dna = rev * (dnaMarginProj / 100);
    const capex = rev * (capexMarginProj / 100);
    const wc = rev * (wcMarginProj / 100);
    const deltaWc = wc - prevWc;

    const fcff = ebiat + dna - capex - deltaWc;

    const discountPeriod = i === 1 ? fractionOfYear * 0.5 : fractionOfYear + (i - 2) + 0.5;
    const discountedFcff = fcff / Math.pow(1 + wacc, discountPeriod);

    let tv = 0;
    let discountedTv = 0;
    if (i === forecastYears) {
      tv = fcff * (1 + termGrowth / 100) / (wacc - termGrowth / 100);
      const tvDiscountPeriod = fractionOfYear + (i - 1);
      discountedTv = tv / Math.pow(1 + wacc, tvDiscountPeriod);
    }

    projections.push({
      year: `${projYear}E`,
      rev, ebit, taxRate: avgTaxRate, ebiat, dna, capex, deltaWc, fcff,
      discountPeriod, discountedFcff, tv, discountedTv, shares,
    });

    prevRev = rev;
    prevWc = wc;
    prevShares = shares;
  }

  let pvFcff = 0;
  projections.forEach(p => { pvFcff += p.discountedFcff; });

  const pvTv = projections[forecastYears - 1].discountedTv;

  const ev = pvFcff + pvTv;
  const totalCash = n(latestBs?.cashAndCashEquivalents);
  const equityValue = ev + totalCash - totalDebt;

  const terminalShares = projections.length > 0 ? projections[forecastYears - 1].shares : sharesOut;
  const intrinsicValue = terminalShares !== 0 ? equityValue / terminalShares : 0;

  const upside = currentPrice !== 0 ? (intrinsicValue - currentPrice) / currentPrice : 0;

  const waccSteps = [-0.02, -0.01, 0, 0.01, 0.02].map(d => wacc + d);
  const growthSteps = [-0.01, -0.005, 0, 0.005, 0.01].map(d => (termGrowth / 100) + d);
  const tvDiscPeriod = fractionOfYear + (forecastYears - 1);
  const lastFcff = projections[forecastYears - 1]?.fcff ?? 0;
  const sensitivityMatrix = growthSteps.map(g =>
    waccSteps.map(w => {
      if (w <= g || w <= 0) return null;
      let pvFcffSens = 0;
      projections.forEach(p => { pvFcffSens += p.fcff / Math.pow(1 + w, p.discountPeriod); });
      const tvSens = lastFcff * (1 + g) / (w - g);
      const pvTvSens = tvSens / Math.pow(1 + w, tvDiscPeriod);
      const equitySens = pvFcffSens + pvTvSens + totalCash - totalDebt;
      return terminalShares > 0 ? equitySens / terminalShares : null;
    })
  );

  return {
    historicalSummary,
    projections,
    intrinsicValue,
    currentPrice,
    upside,
    wacc,
    rawWacc,
    baseWacc,
    beta,
    avgTaxRate,
    baseRev,
    baseEbitMargin: ebitMargin,
    avgDnaMargin5yr,
    avgDnaMargin3yr,
    avgNwcMargin5yr,
    avgNwcMargin3yr,
    avgCapexMargin5yr,
    avgCapexMargin3yr,
    sharesCagr5yr,
    sharesCagr3yr,
    baseWc,
    ev,
    equityValue,
    marketCap,
    totalDebt,
    totalCash,
    sharesOut,
    terminalShares,
    revCagr3yr,
    revCagr5yr,
    maxEbitMargin5yr,
    warnings,
    sensitivityMatrix,
    waccSteps,
    growthSteps,
    fractionOfYear,
  };
}
