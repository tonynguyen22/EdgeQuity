import type { ForecastRow } from '../types';

// Simple CSV-based Excel export (opens correctly in Excel)
export function exportThreeStatementToExcel(data: ForecastRow[], ticker: string) {
  const formatNum = (v: number) => Math.round(v).toLocaleString('en-US');

  // Build 3 separate CSV sections
  const years = data.map(r => r.year);
  const sep = '\t';

  // Income Statement
  let csv = `${ticker} - Three Statement Model\n\n`;
  csv += `INCOME STATEMENT${sep}${years.join(sep)}\n`;
  csv += `Revenue${sep}${data.map(r => formatNum(r.revenue)).join(sep)}\n`;
  csv += `COGS${sep}${data.map(r => formatNum(-r.cogs)).join(sep)}\n`;
  csv += `Gross Profit${sep}${data.map(r => formatNum(r.grossProfit)).join(sep)}\n`;
  csv += `SG&A${sep}${data.map(r => formatNum(-r.sga)).join(sep)}\n`;
  csv += `D&A${sep}${data.map(r => formatNum(-r.da)).join(sep)}\n`;
  csv += `EBIT${sep}${data.map(r => formatNum(r.ebit)).join(sep)}\n`;
  csv += `Interest Expense${sep}${data.map(r => formatNum(-r.interestExpense)).join(sep)}\n`;
  csv += `EBT${sep}${data.map(r => formatNum(r.ebt)).join(sep)}\n`;
  csv += `Tax${sep}${data.map(r => formatNum(-r.tax)).join(sep)}\n`;
  csv += `Net Income${sep}${data.map(r => formatNum(r.netIncome)).join(sep)}\n`;
  csv += `\nGross Margin (%)${sep}${data.map(r => r.grossMargin.toFixed(1) + '%').join(sep)}\n`;
  csv += `EBIT Margin (%)${sep}${data.map(r => r.ebitMargin.toFixed(1) + '%').join(sep)}\n`;
  csv += `Net Margin (%)${sep}${data.map(r => r.netMargin.toFixed(1) + '%').join(sep)}\n`;

  // Balance Sheet
  csv += `\n\nBALANCE SHEET${sep}${years.join(sep)}\n`;
  csv += `Cash${sep}${data.map(r => formatNum(r.cash)).join(sep)}\n`;
  csv += `Receivables${sep}${data.map(r => formatNum(r.receivables)).join(sep)}\n`;
  csv += `Inventory${sep}${data.map(r => formatNum(r.inventory)).join(sep)}\n`;
  csv += `PP&E${sep}${data.map(r => formatNum(r.ppe)).join(sep)}\n`;
  csv += `Total Assets${sep}${data.map(r => formatNum(r.totalAssets)).join(sep)}\n`;
  csv += `Payables${sep}${data.map(r => formatNum(r.payables)).join(sep)}\n`;
  csv += `Total Debt${sep}${data.map(r => formatNum(r.totalDebt)).join(sep)}\n`;
  csv += `Total Equity${sep}${data.map(r => formatNum(r.totalEquity)).join(sep)}\n`;

  // Cash Flow
  csv += `\n\nCASH FLOW STATEMENT${sep}${years.join(sep)}\n`;
  csv += `Cash from Operations${sep}${data.map(r => formatNum(r.cfo)).join(sep)}\n`;
  csv += `CapEx${sep}${data.map(r => formatNum(-r.capex)).join(sep)}\n`;
  csv += `Cash from Investing${sep}${data.map(r => formatNum(r.cfi)).join(sep)}\n`;
  csv += `Cash from Financing${sep}${data.map(r => formatNum(r.cff)).join(sep)}\n`;
  csv += `Free Cash Flow${sep}${data.map(r => formatNum(r.fcf)).join(sep)}\n`;

  // Create download
  const blob = new Blob([csv], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ticker}_3_Statement_Model.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
