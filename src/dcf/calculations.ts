import { parseNum } from './utils/formatters';
import type { FinancialData, DCFInputs, DCFResult } from './types';

export function findConcept(section: any[], concepts: string[]): number {
  if (!section) return 0;
  for (const concept of concepts) {
    const item = section.find((i: any) => i.concept === concept);
    if (item) return parseNum(item.value);
  }
  return 0;
}

export function findConceptByLabel(section: any[], keywords: string[]): number {
  if (!section) return 0;
  const lower = keywords.map(k => k.toLowerCase());
  const item = section.find((i: any) => {
    const label = (i.label || '').toLowerCase();
    return lower.every(kw => label.includes(kw));
  });
  return item ? parseNum(item.value) : 0;
}

export const REV_CONCEPTS = [
  'us-gaap_Revenues',
  'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax',
  'us-gaap_RevenueFromContractWithCustomerIncludingAssessedTax',
  'us-gaap_SalesRevenueNet',
  'ifrs-full_Revenue',
];

export function computeDCF(data: FinancialData, inputs: DCFInputs): DCFResult {
  const {
    revGrowthStart, revGrowthEnd, ebitMarginStart, ebitMarginEnd,
    termGrowth, waccAdj, erp,
    dnaMarginProj, wcMarginProj, capexMarginProj, sharesGrowthProj, forecastYears,
  } = inputs;

  const { financials, profile, metrics } = data;

  if (!financials || financials.length === 0) {
    throw new Error('No financial data');
  }

  const getRev = (report: any) => findConcept(report.report.ic, REV_CONCEPTS);
  const getShares = (report: any) =>
    findConcept(report.report.ic, ['us-gaap_WeightedAverageNumberOfSharesOutstandingBasic', 'ifrs-full_WeightedAverageShares', 'ifrs-full_NumberOfSharesOutstanding']) ||
    findConcept(report.report.bs, ['us-gaap_CommonStockSharesOutstanding']);

  const revs = financials.slice(0, 6).map(getRev);
  let revCagr3yr = 0;
  let revCagr5yr = 0;
  if (revs.length >= 4 && revs[3] > 0 && revs[0] > 0) {
    revCagr3yr = Math.pow(revs[0] / revs[3], 1 / 3) - 1;
  }
  if (revs.length >= 6 && revs[5] > 0 && revs[0] > 0) {
    revCagr5yr = Math.pow(revs[0] / revs[5], 1 / 5) - 1;
  }

  const historicalSummary = financials.slice(0, 6).map((report: any, index: number, arr: any[]) => {
    const ic = report.report.ic;
    const bs = report.report.bs;
    const cf = report.report.cf;

    const rev = getRev(report);
    const prevRev = index < arr.length - 1 ? getRev(arr[index + 1]) : rev;
    const revGrowth = prevRev ? (rev - prevRev) / prevRev : 0;

    const cogs = findConcept(ic, ['us-gaap_CostOfRevenue', 'us-gaap_CostOfGoodsAndServicesSold', 'us-gaap_CostOfGoodsSold', 'us-gaap_CostOfServices', 'ifrs-full_CostOfSales']);
    const sga = Math.abs(findConcept(ic, ['us-gaap_SellingGeneralAndAdministrativeExpense', 'us-gaap_SellingGeneralAndAdministrativeExpenses', 'us-gaap_GeneralAndAdministrativeExpense', 'ifrs-full_SellingGeneralAndAdministrativeExpense']));
    const rd = Math.abs(findConcept(ic, ['us-gaap_ResearchAndDevelopmentExpense', 'us-gaap_ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost']));
    let gp = findConcept(ic, ['us-gaap_GrossProfit', 'ifrs-full_GrossProfit']);
    if (!gp && rev > 0 && cogs > 0) gp = rev - cogs;
    let ebit = findConcept(ic, ['us-gaap_OperatingIncomeLoss', 'ifrs-full_ProfitLossFromOperatingActivities']);
    if (!ebit) {
      const ebt = findConcept(ic, [
        'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
        'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
        'ifrs-full_ProfitLossBeforeTax',
      ]);
      const intExp = Math.abs(findConcept(ic, ['us-gaap_InterestExpense', 'us-gaap_InterestExpenseNonoperating', 'us-gaap_InterestAndDebtExpense', 'ifrs-full_FinanceCosts']));
      const intInc = Math.abs(findConcept(ic, ['us-gaap_InvestmentIncomeInterest', 'us-gaap_InterestAndDividendIncomeOperating', 'ifrs-full_FinanceIncome']));
      if (ebt) ebit = ebt + intExp - intInc;
    }
    if (!ebit && gp > 0 && sga > 0) ebit = gp - sga - rd;
    const tax = findConcept(ic, ['us-gaap_IncomeTaxExpenseBenefit', 'ifrs-full_IncomeTaxExpenseContinuingOperations', 'ifrs-full_IncomeTaxExpense']);
    const netIncome = findConcept(ic, ['us-gaap_NetIncomeLoss', 'ifrs-full_ProfitLoss']);
    const da = findConcept(cf, ['us-gaap_DepreciationDepletionAndAmortization', 'us-gaap_DepreciationAmortizationAndAccretionNet', 'us-gaap_DepreciationAndAmortization', 'us-gaap_Depreciation', 'ifrs-full_DepreciationAndAmortisationExpense']) || findConcept(ic, ['us-gaap_DepreciationDepletionAndAmortization', 'us-gaap_DepreciationAndAmortization', 'us-gaap_Depreciation']) || findConceptByLabel(cf, ['depreciation', 'amortization']);
    const ebitda = ebit + da;
    const eps = findConcept(ic, ['us-gaap_EarningsPerShareBasic', 'ifrs-full_BasicEarningsLossPerShare']);
    const shares = findConcept(ic, ['us-gaap_WeightedAverageNumberOfSharesOutstandingBasic', 'ifrs-full_WeightedAverageShares', 'ifrs-full_NumberOfSharesOutstanding']) || findConcept(bs, ['us-gaap_CommonStockSharesOutstanding']);

    const totalAssets = findConcept(bs, ['us-gaap_Assets', 'ifrs-full_Assets']);
    const currentLiabilities = findConcept(bs, ['us-gaap_LiabilitiesCurrent', 'ifrs-full_CurrentLiabilities']);
    const nonCurrentLiabilities = findConcept(bs, ['us-gaap_LiabilitiesNoncurrent', 'ifrs-full_NoncurrentLiabilities']);
    const totalLiabilities = findConcept(bs, ['us-gaap_Liabilities', 'ifrs-full_Liabilities']) || (currentLiabilities + nonCurrentLiabilities);
    const totalEquity = findConcept(bs, ['us-gaap_StockholdersEquity', 'us-gaap_StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', 'us-gaap_PartnersCapital', 'us-gaap_CommonStockholdersEquity', 'ifrs-full_Equity']);
    const cash = findConcept(bs, ['us-gaap_CashAndCashEquivalentsAtCarryingValue', 'us-gaap_CashAndCashEquivalentsAtCarryingValueIncludingVariableInterestEntities', 'ifrs-full_CashAndCashEquivalents']);

    const currentAssets = findConcept(bs, ['us-gaap_AssetsCurrent', 'ifrs-full_CurrentAssets']);
    const inventory = findConcept(bs, ['us-gaap_InventoryNet', 'ifrs-full_Inventories']);

    const shortTermDebt = findConcept(bs, ['us-gaap_LongTermDebtCurrent', 'us-gaap_ShortTermDebt', 'us-gaap_DebtCurrent', 'us-gaap_ShortTermBorrowings', 'us-gaap_CommercialPaper', 'us-gaap_NotesPayableCurrent', 'us-gaap_LongTermDebtAndCapitalLeaseObligationsCurrent', 'tsla_LongTermDebtAndFinanceLeasesCurrent', 'ifrs-full_CurrentBorrowings']);
    const longTermDebt = findConcept(bs, ['us-gaap_LongTermDebtNoncurrent', 'us-gaap_LongTermDebt', 'us-gaap_LongTermDebtAndCapitalLeaseObligations', 'us-gaap_LongTermDebtAndCapitalLeaseObligationsNoncurrent', 'tsla_LongTermDebtAndFinanceLeasesNoncurrent', 'ifrs-full_NoncurrentBorrowings']);
    const totalDebt = shortTermDebt + longTermDebt;

    const interestExpense = Math.abs(findConcept(ic, ['us-gaap_InterestExpense', 'us-gaap_InterestExpenseNonoperating', 'us-gaap_InterestPaidNet', 'ifrs-full_InterestExpense']) || findConcept(cf, ['us-gaap_InterestPaidNet', 'ifrs-full_InterestPaidClassifiedAsOperatingActivities']));

    const cfo = findConcept(cf, ['us-gaap_NetCashProvidedByUsedInOperatingActivities', 'us-gaap_NetCashProvidedByUsedInOperatingActivitiesContinuingOperations', 'ifrs-full_CashFlowsFromUsedInOperatingActivities']);
    const cfi = findConcept(cf, ['us-gaap_NetCashProvidedByUsedInInvestingActivities', 'us-gaap_NetCashProvidedByUsedInInvestingActivitiesContinuingOperations', 'ifrs-full_CashFlowsFromUsedInInvestingActivities']);
    const cff = findConcept(cf, ['us-gaap_NetCashProvidedByUsedInFinancingActivities', 'us-gaap_NetCashProvidedByUsedInFinancingActivitiesContinuingOperations', 'ifrs-full_CashFlowsFromUsedInFinancingActivities']);
    const capex = Math.abs(findConcept(cf, ['us-gaap_PaymentsToAcquirePropertyPlantAndEquipment', 'ifrs-full_PurchaseOfPropertyPlantAndEquipment']));
    const changeInCash = findConcept(cf, ['us-gaap_CashAndCashEquivalentsPeriodIncreaseDecrease', 'us-gaap_CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect', 'ifrs-full_IncreaseDecreaseInCashAndCashEquivalents']);
    const dividendsPaid = Math.abs(findConcept(cf, ['us-gaap_PaymentsOfDividends', 'us-gaap_PaymentsOfDividendsCommonStock', 'us-gaap_PaymentsOfOrdinaryDividends', 'ifrs-full_DividendsPaid']));
    const debtRepayment = Math.abs(findConcept(cf, ['us-gaap_RepaymentsOfLongTermDebt', 'us-gaap_RepaymentsOfDebt', 'ifrs-full_RepaymentsOfBorrowings']));

    const currentRatio = currentLiabilities ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities ? (currentAssets - inventory) / currentLiabilities : 0;
    const interestCoverage = interestExpense ? ebit / interestExpense : 0;
    const debtToEquity = totalEquity ? totalDebt / totalEquity : 0;
    const roe = totalEquity ? netIncome / totalEquity : 0;
    const roa = totalAssets ? netIncome / totalAssets : 0;

    const netReceivables = findConcept(bs, ['us-gaap_AccountsReceivableNetCurrent', 'ifrs-full_TradeAndOtherCurrentReceivables']);
    const accountsPayable = findConcept(bs, ['us-gaap_AccountsPayableCurrent', 'ifrs-full_TradeAndOtherCurrentPayables']);
    const wc = (netReceivables + inventory) - accountsPayable;

    const ebiat = ebit - tax;
    const fcff = ebiat + da - capex;

    const yearStr = report.endDate ? report.endDate.substring(0, 7) : report.year;

    return {
      year: yearStr,
      rev, revGrowth, gp, gpm: rev ? gp / rev : 0,
      cogs, sga, rd, tax, interestExpense,
      ebit, ebitMargin: rev ? ebit / rev : 0,
      ebitda, ebitdaMargin: rev ? ebitda / rev : 0,
      netIncome, netProfitMargin: rev ? netIncome / rev : 0,
      eps, shares,
      totalAssets, totalLiabilities, totalDebt, totalEquity, cash, wc,
      cfo, cfi, cff, capex, changeInCash, dividendsPaid, debtRepayment,
      currentRatio, quickRatio, interestCoverage, debtToEquity, roe, roa,
      grossMargin: rev ? gp / rev : 0,
      profitMargin: rev ? netIncome / rev : 0,
      taxRate: ebit ? tax / ebit : 0,
      ebiat, dna: da, deltaWc: 0, fcff
    };
  }).slice(0, 5).reverse();

  const maxEbitMargin5yr = historicalSummary.length > 0
    ? Math.max(...historicalSummary.map((y: any) => y.ebitMargin))
    : 0;

  const taxRates = financials.slice(0, 5).map((report: any) => {
    const ic = report.report.ic;
    const tax = findConcept(ic, ['us-gaap_IncomeTaxExpenseBenefit', 'ifrs-full_IncomeTaxExpenseContinuingOperations', 'ifrs-full_IncomeTaxExpense']);
    const ebt = findConcept(ic, ['us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest', 'us-gaap_IncomeBeforeTax', 'ifrs-full_ProfitLossBeforeTax']);
    return ebt !== 0 ? tax / ebt : 0;
  });
  const avgTaxRate = taxRates.length > 0 ? taxRates.reduce((a: number, b: number) => a + b, 0) / taxRates.length : 0.21;

  const getDnaMargin = (report: any) => {
    const cf = report.report.cf;
    const ic = report.report.ic;
    const rev = findConcept(ic, REV_CONCEPTS);
    const dna = findConcept(cf, ['us-gaap_DepreciationDepletionAndAmortization', 'us-gaap_DepreciationAmortizationAndAccretionNet', 'us-gaap_DepreciationAndAmortization', 'us-gaap_Depreciation', 'ifrs-full_DepreciationAndAmortisationExpense']) || findConcept(ic, ['us-gaap_DepreciationDepletionAndAmortization', 'us-gaap_DepreciationAndAmortization', 'us-gaap_Depreciation']) || findConceptByLabel(cf, ['depreciation', 'amortization']);
    return rev ? dna / rev : 0;
  };
  const getNwcMargin = (report: any) => {
    const bs = report.report.bs;
    const ic = report.report.ic;
    const rev = findConcept(ic, REV_CONCEPTS);
    const netReceivables = findConcept(bs, ['us-gaap_AccountsReceivableNetCurrent', 'ifrs-full_TradeAndOtherCurrentReceivables']);
    const inventory = findConcept(bs, ['us-gaap_InventoryNet', 'ifrs-full_Inventories']);
    const accountsPayable = findConcept(bs, ['us-gaap_AccountsPayableCurrent', 'ifrs-full_TradeAndOtherCurrentPayables']);
    const wc = (netReceivables + inventory) - accountsPayable;
    return rev ? wc / rev : 0;
  };
  const getCapexMargin = (report: any) => {
    const cf = report.report.cf;
    const ic = report.report.ic;
    const rev = findConcept(ic, REV_CONCEPTS);
    const capex = Math.abs(findConcept(cf, ['us-gaap_PaymentsToAcquirePropertyPlantAndEquipment', 'ifrs-full_PurchaseOfPropertyPlantAndEquipment']));
    return rev ? capex / rev : 0;
  };

  const dnaMargins = financials.slice(0, 5).map(getDnaMargin);
  const avgDnaMargin5yr = dnaMargins.reduce((a, b) => a + b, 0) / (dnaMargins.length || 1);
  const avgDnaMargin3yr = dnaMargins.slice(0, 3).reduce((a, b) => a + b, 0) / (Math.min(dnaMargins.length, 3) || 1);

  const nwcMargins = financials.slice(0, 5).map(getNwcMargin);
  const avgNwcMargin5yr = nwcMargins.reduce((a, b) => a + b, 0) / (nwcMargins.length || 1);
  const avgNwcMargin3yr = nwcMargins.slice(0, 3).reduce((a, b) => a + b, 0) / (Math.min(nwcMargins.length, 3) || 1);

  const capexMargins = financials.slice(0, 5).map(getCapexMargin);
  const avgCapexMargin5yr = capexMargins.reduce((a, b) => a + b, 0) / (capexMargins.length || 1);
  const avgCapexMargin3yr = capexMargins.slice(0, 3).reduce((a, b) => a + b, 0) / (Math.min(capexMargins.length, 3) || 1);

  const sharesVals = financials.slice(0, 6).map((r: any) => findConcept(r.report.bs, ['us-gaap_CommonStockSharesOutstanding', 'ifrs-full_NumberOfSharesOutstanding']) || findConcept(r.report.ic, ['us-gaap_WeightedAverageNumberOfSharesOutstandingBasic', 'ifrs-full_WeightedAverageShares']));
  let sharesCagr5yr = 0;
  let sharesCagr3yr = 0;
  if (sharesVals.length >= 6 && sharesVals[5] > 0 && sharesVals[0] > 0) sharesCagr5yr = Math.pow(sharesVals[0] / sharesVals[5], 1 / 5) - 1;
  if (sharesVals.length >= 4 && sharesVals[3] > 0 && sharesVals[0] > 0) sharesCagr3yr = Math.pow(sharesVals[0] / sharesVals[3], 1 / 3) - 1;

  const latestReport = financials[0].report;
  const ic = latestReport.ic;
  const bs = latestReport.bs;
  const cf = latestReport.cf;

  const baseRev = findConcept(ic, REV_CONCEPTS);
  let baseEbit = findConcept(ic, ['us-gaap_OperatingIncomeLoss', 'ifrs-full_ProfitLossFromOperatingActivities']);
  if (!baseEbit) {
    const baseEbt = findConcept(ic, [
      'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
      'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
      'ifrs-full_ProfitLossBeforeTax',
    ]);
    const baseIntExp = Math.abs(findConcept(ic, ['us-gaap_InterestExpense', 'us-gaap_InterestExpenseNonoperating', 'us-gaap_InterestAndDebtExpense', 'ifrs-full_FinanceCosts']));
    const baseIntInc = Math.abs(findConcept(ic, ['us-gaap_InvestmentIncomeInterest', 'us-gaap_InterestAndDividendIncomeOperating', 'ifrs-full_FinanceIncome']));
    if (baseEbt) baseEbit = baseEbt + baseIntExp - baseIntInc;
  }
  if (!baseEbit && baseRev > 0) {
    const baseGp = findConcept(ic, ['us-gaap_GrossProfit', 'ifrs-full_GrossProfit']);
    const baseSga = Math.abs(findConcept(ic, ['us-gaap_SellingGeneralAndAdministrativeExpense', 'us-gaap_SellingGeneralAndAdministrativeExpenses', 'us-gaap_GeneralAndAdministrativeExpense']));
    const baseRd = Math.abs(findConcept(ic, ['us-gaap_ResearchAndDevelopmentExpense']));
    if (baseGp > 0 && baseSga > 0) baseEbit = baseGp - baseSga - baseRd;
  }
  const ebitMargin = baseRev !== 0 ? baseEbit / baseRev : 0;

  const baseDna = findConcept(cf, ['us-gaap_DepreciationDepletionAndAmortization', 'us-gaap_DepreciationAmortizationAndAccretionNet', 'us-gaap_DepreciationAndAmortization', 'us-gaap_Depreciation', 'ifrs-full_DepreciationAndAmortisationExpense']) || findConcept(ic, ['us-gaap_DepreciationDepletionAndAmortization', 'us-gaap_DepreciationAndAmortization', 'us-gaap_Depreciation']) || findConceptByLabel(cf, ['depreciation', 'amortization']);

  const baseCapex = Math.abs(findConcept(cf, ['us-gaap_PaymentsToAcquirePropertyPlantAndEquipment', 'ifrs-full_PurchaseOfPropertyPlantAndEquipment']));

  const netReceivables = findConcept(bs, ['us-gaap_AccountsReceivableNetCurrent', 'ifrs-full_TradeAndOtherCurrentReceivables']);
  const inventory = findConcept(bs, ['us-gaap_InventoryNet', 'ifrs-full_Inventories']);
  const accountsPayable = findConcept(bs, ['us-gaap_AccountsPayableCurrent', 'ifrs-full_TradeAndOtherCurrentPayables']);
  const baseWc = (netReceivables + inventory) - accountsPayable;

  const beta = parseNum(metrics?.beta) || 1.0;
  const rf = 0.04;
  const ke = rf + beta * (erp / 100);

  const shortTermDebt = findConcept(bs, ['us-gaap_LongTermDebtCurrent', 'us-gaap_ShortTermDebt', 'us-gaap_DebtCurrent', 'us-gaap_ShortTermBorrowings', 'us-gaap_CommercialPaper', 'us-gaap_NotesPayableCurrent', 'us-gaap_LongTermDebtAndCapitalLeaseObligationsCurrent', 'tsla_LongTermDebtAndFinanceLeasesCurrent', 'ifrs-full_CurrentBorrowings']);
  const longTermDebt = findConcept(bs, ['us-gaap_LongTermDebtNoncurrent', 'us-gaap_LongTermDebt', 'us-gaap_LongTermDebtAndCapitalLeaseObligations', 'us-gaap_LongTermDebtAndCapitalLeaseObligationsNoncurrent', 'tsla_LongTermDebtAndFinanceLeasesNoncurrent', 'ifrs-full_NoncurrentBorrowings']);
  const totalDebt = shortTermDebt + longTermDebt;

  const interestExpense = Math.abs(findConcept(ic, ['us-gaap_InterestExpense', 'us-gaap_InterestExpenseNonoperating', 'us-gaap_InterestPaidNet', 'ifrs-full_InterestExpense']) || findConcept(cf, ['us-gaap_InterestPaidNet', 'ifrs-full_InterestPaidClassifiedAsOperatingActivities']));
  const kd = totalDebt !== 0 ? interestExpense / totalDebt : 0;

  const marketCap = parseNum(profile?.marketCapitalization) * 1e6 || parseNum(metrics?.marketCapitalization) * 1e6;
  const totalValue = marketCap + totalDebt;
  const wEquity = totalValue !== 0 ? marketCap / totalValue : 1;
  const wDebt = totalValue !== 0 ? totalDebt / totalValue : 0;

  const rawWacc = wEquity * ke + wDebt * kd * (1 - avgTaxRate);
  const baseWacc = Math.max(rawWacc, 0.06);
  const wacc = Math.max(baseWacc + (waccAdj / 100), (termGrowth / 100) + 0.02);

  const sharesOut = parseNum(profile?.shareOutstanding) * 1e6 || findConcept(bs, ['us-gaap_CommonStockSharesOutstanding', 'us-gaap_WeightedAverageNumberOfSharesOutstandingBasic', 'ifrs-full_WeightedAverageShares', 'ifrs-full_NumberOfSharesOutstanding']);

  const projections = [];
  let prevRev = baseRev;
  let prevWc = baseWc;
  const lastHistShares = historicalSummary.length > 0 ? historicalSummary[historicalSummary.length - 1].shares : sharesOut;
  let prevShares = lastHistShares || sharesOut;
  let prevCapex = baseCapex;

  const lastHistYearStr = historicalSummary.length > 0 ? historicalSummary[historicalSummary.length - 1].year.toString() : new Date().getFullYear().toString();
  const lastYearNum = parseInt(lastHistYearStr.substring(0, 4));

  const currentMonth = new Date().getMonth() + 1;
  const fractionOfYear = 1 - (currentMonth / 12);

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
      discountPeriod, discountedFcff, tv, discountedTv, shares
    });

    prevRev = rev;
    prevWc = wc;
    prevShares = shares;
  }

  let pvFcff = 0;
  projections.forEach((p) => { pvFcff += p.discountedFcff; });

  const tv = projections[forecastYears - 1].tv;
  const pvTv = projections[forecastYears - 1].discountedTv;

  const ev = pvFcff + pvTv;
  const totalCash = findConcept(bs, ['us-gaap_CashAndCashEquivalentsAtCarryingValue', 'us-gaap_CashAndCashEquivalentsAtCarryingValueIncludingVariableInterestEntities', 'ifrs-full_CashAndCashEquivalents']);
  const equityValue = ev + totalCash - totalDebt;

  const terminalShares = projections.length > 0 ? projections[forecastYears - 1].shares : sharesOut;
  const intrinsicValue = terminalShares !== 0 ? equityValue / terminalShares : 0;

  const currentPrice = sharesOut !== 0 ? marketCap / sharesOut : 0;
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
    sensitivityMatrix,
    waccSteps,
    growthSteps,
    fractionOfYear,
  };
}
