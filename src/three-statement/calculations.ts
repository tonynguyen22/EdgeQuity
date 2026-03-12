import type { ThreeStmtInputs, HistoricalBase, ForecastRow } from './types';

export function buildForecast(
  historicals: HistoricalBase[],
  inputs: ThreeStmtInputs,
): ForecastRow[] {
  if (historicals.length === 0) return [];

  const last = historicals[historicals.length - 1];
  const results: ForecastRow[] = [];

  // Convert historicals to ForecastRow
  for (let i = 0; i < historicals.length; i++) {
    const h = historicals[i];
    const prevRev = i > 0 ? historicals[i - 1].revenue : h.revenue;
    results.push({
      ...h,
      isProjected: false,
      revenueGrowth: prevRev > 0 ? ((h.revenue - prevRev) / prevRev) * 100 : 0,
      grossMargin: h.revenue > 0 ? (h.grossProfit / h.revenue) * 100 : 0,
      ebitMargin: h.revenue > 0 ? (h.ebit / h.revenue) * 100 : 0,
      netMargin: h.revenue > 0 ? (h.netIncome / h.revenue) * 100 : 0,
      fcf: h.cfo - Math.abs(h.capex),
      wcChange: 0,
    });
  }

  let prevRow = results[results.length - 1];

  for (let y = 0; y < inputs.forecastYears; y++) {
    const growthRate = y < inputs.revenueGrowths.length
      ? inputs.revenueGrowths[y]
      : inputs.revenueGrowths[inputs.revenueGrowths.length - 1];

    // Income Statement
    const revenue = prevRow.revenue * (1 + growthRate / 100);
    const cogs = revenue * (inputs.cogsPercent / 100);
    const grossProfit = revenue - cogs;
    const sga = revenue * (inputs.sgaPercent / 100);
    const da = revenue * (inputs.daPercent / 100);
    const ebit = grossProfit - sga - da;
    const interestExpense = prevRow.totalDebt * (inputs.interestRate / 100);
    const ebt = ebit - interestExpense;
    const tax = Math.max(0, ebt * (inputs.taxRate / 100));
    const netIncome = ebt - tax;

    // Balance Sheet - Working Capital
    const receivables = revenue * (inputs.dso / 365);
    const inventory = cogs * (inputs.dio / 365);
    const payables = cogs * (inputs.dpo / 365);
    const wcPrev = prevRow.receivables + prevRow.inventory - prevRow.payables;
    const wcCurr = receivables + inventory - payables;
    const wcChange = wcCurr - wcPrev;

    // CapEx & PP&E
    const capex = revenue * (inputs.capexPercent / 100);
    const ppe = prevRow.ppe + capex - da;

    // Cash Flow
    const cfo = netIncome + da - wcChange;
    const cfi = -capex;
    const dividends = Math.max(0, netIncome * (inputs.dividendPayout / 100));
    const cff = inputs.newDebt - inputs.debtRepayment - dividends;

    const netCashChange = cfo + cfi + cff;
    const cash = prevRow.cash + netCashChange;

    // Debt
    const totalDebt = prevRow.totalDebt + inputs.newDebt - inputs.debtRepayment;
    const totalEquity = prevRow.totalEquity + netIncome - dividends;
    const totalAssets = ppe + cash + receivables + inventory + (prevRow.totalAssets - prevRow.ppe - prevRow.cash - prevRow.receivables - prevRow.inventory);

    const fcf = cfo - capex;

    const yearNum = parseInt(prevRow.year) + 1;
    const row: ForecastRow = {
      year: `${yearNum}E`,
      revenue,
      cogs,
      grossProfit,
      sga,
      da,
      ebit,
      interestExpense,
      ebt,
      tax,
      netIncome,
      totalAssets,
      totalDebt: Math.max(0, totalDebt),
      cash: Math.max(0, cash),
      ppe: Math.max(0, ppe),
      receivables,
      inventory,
      payables,
      totalEquity,
      capex: capex,
      cfo,
      cfi,
      cff,
      isProjected: true,
      revenueGrowth: growthRate,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      ebitMargin: revenue > 0 ? (ebit / revenue) * 100 : 0,
      netMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      fcf,
      wcChange,
    };

    results.push(row);
    prevRow = row;
  }

  return results;
}
