import * as XLSX from 'xlsx';
import { parseNum } from './formatters';
import { findConcept } from '../calculations';
import type { FinancialData } from '../types';

export function exportToExcel(data: FinancialData, ticker: string) {
  if (!data || !data.financials) return;

  const wb = XLSX.utils.book_new();

  const icData = data.financials.map((f: any) => {
    const ic = f.report.ic;
    return {
      Year: f.year,
      Revenue: findConcept(ic, ['us-gaap_Revenues', 'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax', 'us-gaap_RevenueFromContractWithCustomerIncludingAssessedTax', 'us-gaap_SalesRevenueNet', 'ifrs-full_Revenue']),
      COGS: findConcept(ic, ['us-gaap_CostOfGoodsAndServicesSold']),
      GrossProfit: findConcept(ic, ['us-gaap_GrossProfit']),
      OperatingExpenses: findConcept(ic, ['us-gaap_OperatingExpenses']),
      OperatingIncome: findConcept(ic, ['us-gaap_OperatingIncomeLoss']),
      NetIncome: findConcept(ic, ['us-gaap_NetIncomeLoss']),
    };
  });
  const wsIc = XLSX.utils.json_to_sheet(icData);
  XLSX.utils.book_append_sheet(wb, wsIc, "Income Statement");

  const bsData = data.financials.map((f: any) => {
    const bs = f.report.bs;
    return {
      Year: f.year,
      CashAndEquivalents: findConcept(bs, ['us-gaap_CashAndCashEquivalentsAtCarryingValue']),
      AccountsReceivable: findConcept(bs, ['us-gaap_AccountsReceivableNetCurrent']),
      Inventory: findConcept(bs, ['us-gaap_InventoryNet']),
      TotalCurrentAssets: findConcept(bs, ['us-gaap_AssetsCurrent']),
      TotalAssets: findConcept(bs, ['us-gaap_Assets']),
      AccountsPayable: findConcept(bs, ['us-gaap_AccountsPayableCurrent']),
      TotalCurrentLiabilities: findConcept(bs, ['us-gaap_LiabilitiesCurrent']),
      TotalLiabilities: findConcept(bs, ['us-gaap_Liabilities']),
      TotalEquity: findConcept(bs, ['us-gaap_StockholdersEquity']),
    };
  });
  const wsBs = XLSX.utils.json_to_sheet(bsData);
  XLSX.utils.book_append_sheet(wb, wsBs, "Balance Sheet");

  const cfData = data.financials.map((f: any) => {
    const cf = f.report.cf;
    return {
      Year: f.year,
      NetIncome: findConcept(cf, ['us-gaap_NetIncomeLoss']),
      DepreciationAndAmortization: findConcept(cf, ['us-gaap_DepreciationDepletionAndAmortization', 'us-gaap_DepreciationAmortizationAndAccretionNet']),
      OperatingCashFlow: findConcept(cf, ['us-gaap_NetCashProvidedByUsedInOperatingActivities', 'us-gaap_NetCashProvidedByUsedInOperatingActivitiesContinuingOperations']),
      CapitalExpenditures: findConcept(cf, ['us-gaap_PaymentsToAcquirePropertyPlantAndEquipment']),
      InvestingCashFlow: findConcept(cf, ['us-gaap_NetCashProvidedByUsedInInvestingActivities', 'us-gaap_NetCashProvidedByUsedInInvestingActivitiesContinuingOperations']),
      FinancingCashFlow: findConcept(cf, ['us-gaap_NetCashProvidedByUsedInFinancingActivities', 'us-gaap_NetCashProvidedByUsedInFinancingActivitiesContinuingOperations']),
    };
  });
  const wsCf = XLSX.utils.json_to_sheet(cfData);
  XLSX.utils.book_append_sheet(wb, wsCf, "Cash Flow");

  XLSX.writeFile(wb, `${ticker}_Financials.xlsx`);
}
