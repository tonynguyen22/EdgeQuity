import * as XLSX from 'xlsx';
import type { FinancialData } from '../types';

export function exportToExcel(data: FinancialData, ticker: string) {
  if (!data) return;

  const wb = XLSX.utils.book_new();

  const icData = data.incomeStatements.map(ic => ({
    Year: ic.fiscalYear || ic.date?.substring(0, 4),
    Revenue: ic.revenue,
    CostOfRevenue: ic.costOfRevenue,
    GrossProfit: ic.grossProfit,
    RAndD: ic.researchAndDevelopmentExpenses,
    GA: ic.generalAndAdministrativeExpenses,
    SAndM: ic.sellingAndMarketingExpenses,
    SGA: ic.sellingGeneralAndAdministrativeExpenses,
    OtherExpenses: ic.otherExpenses,
    OperatingExpenses: ic.operatingExpenses,
    CostAndExpenses: ic.costAndExpenses,
    OperatingIncome: ic.operatingIncome,
    EBIT: ic.ebit,
    DAndA: ic.depreciationAndAmortization,
    EBITDA: ic.ebitda,
    InterestIncome: ic.interestIncome,
    InterestExpense: ic.interestExpense,
    TotalOtherIncomeExpensesNet: ic.totalOtherIncomeExpensesNet,
    IncomeBeforeTax: ic.incomeBeforeTax,
    IncomeTaxExpense: ic.incomeTaxExpense,
    NetIncomeFromContinuingOps: ic.netIncomeFromContinuingOperations,
    NetIncome: ic.netIncome,
    EPS: ic.eps,
    EPSDiluted: ic.epsDiluted,
    SharesOutstanding: ic.weightedAverageShsOut,
    SharesOutstandingDiluted: ic.weightedAverageShsOutDil,
  }));
  const wsIc = XLSX.utils.json_to_sheet(icData);
  XLSX.utils.book_append_sheet(wb, wsIc, 'Income Statement');

  const bsData = data.balanceSheets.map(bs => ({
    Year: bs.fiscalYear || bs.date?.substring(0, 4),
    CashAndEquivalents: bs.cashAndCashEquivalents,
    ShortTermInvestments: bs.shortTermInvestments,
    CashAndShortTermInvestments: bs.cashAndShortTermInvestments,
    NetReceivables: bs.netReceivables,
    AccountsReceivables: bs.accountsReceivables,
    Inventory: bs.inventory,
    OtherCurrentAssets: bs.otherCurrentAssets,
    TotalCurrentAssets: bs.totalCurrentAssets,
    PropertyPlantEquipmentNet: bs.propertyPlantEquipmentNet,
    Goodwill: bs.goodwill,
    IntangibleAssets: bs.intangibleAssets,
    LongTermInvestments: bs.longTermInvestments,
    TotalNonCurrentAssets: bs.totalNonCurrentAssets,
    TotalAssets: bs.totalAssets,
    AccountsPayable: bs.accountPayables,
    ShortTermDebt: bs.shortTermDebt,
    DeferredRevenue: bs.deferredRevenue,
    OtherCurrentLiabilities: bs.otherCurrentLiabilities,
    TotalCurrentLiabilities: bs.totalCurrentLiabilities,
    LongTermDebt: bs.longTermDebt,
    TotalNonCurrentLiabilities: bs.totalNonCurrentLiabilities,
    TotalLiabilities: bs.totalLiabilities,
    CommonStock: bs.commonStock,
    RetainedEarnings: bs.retainedEarnings,
    AOCI: bs.accumulatedOtherComprehensiveIncomeLoss,
    TotalStockholdersEquity: bs.totalStockholdersEquity,
    TotalEquity: bs.totalEquity,
    TotalLiabilitiesAndEquity: bs.totalLiabilitiesAndTotalEquity,
    TotalDebt: bs.totalDebt,
    NetDebt: bs.netDebt,
    TotalInvestments: bs.totalInvestments,
  }));
  const wsBs = XLSX.utils.json_to_sheet(bsData);
  XLSX.utils.book_append_sheet(wb, wsBs, 'Balance Sheet');

  const cfData = data.cashFlows.map(cf => ({
    Year: cf.fiscalYear || cf.date?.substring(0, 4),
    NetIncome: cf.netIncome,
    DepreciationAndAmortization: cf.depreciationAndAmortization,
    DeferredIncomeTax: cf.deferredIncomeTax,
    StockBasedCompensation: cf.stockBasedCompensation,
    ChangeInWorkingCapital: cf.changeInWorkingCapital,
    AccountsReceivables: cf.accountsReceivables,
    Inventory: cf.inventory,
    AccountsPayables: cf.accountsPayables,
    OtherNonCashItems: cf.otherNonCashItems,
    OperatingCashFlow: cf.operatingCashFlow,
    CapitalExpenditure: cf.capitalExpenditure,
    AcquisitionsNet: cf.acquisitionsNet,
    PurchasesOfInvestments: cf.purchasesOfInvestments,
    SalesMaturitiesOfInvestments: cf.salesMaturitiesOfInvestments,
    InvestingCashFlow: cf.netCashProvidedByInvestingActivities,
    NetDebtIssuance: cf.netDebtIssuance,
    CommonStockRepurchased: cf.commonStockRepurchased,
    CommonDividendsPaid: cf.commonDividendsPaid,
    OtherFinancingActivities: cf.otherFinancingActivities,
    FinancingCashFlow: cf.netCashProvidedByFinancingActivities,
    FreeCashFlow: cf.freeCashFlow,
    NetChangeInCash: cf.netChangeInCash,
    IncomeTaxesPaid: cf.incomeTaxesPaid,
    InterestPaid: cf.interestPaid,
  }));
  const wsCf = XLSX.utils.json_to_sheet(cfData);
  XLSX.utils.book_append_sheet(wb, wsCf, 'Cash Flow');

  XLSX.writeFile(wb, `${ticker}_Financials.xlsx`);
}
