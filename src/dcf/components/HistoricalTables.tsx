import React from 'react';
import { formatModelCurrency, formatModelNumber, formatPct } from '../utils/formatters';
import type { DCFResult, FormatUnit } from '../types';

interface HistoricalTablesProps {
  dcf: DCFResult;
  formatUnit: FormatUnit;
  showTitle?: boolean;
}

export default function HistoricalTables({ dcf, formatUnit, showTitle = true }: HistoricalTablesProps) {
  const h = dcf.historicalSummary;

  const row = (label: string, getter: (p: any) => number | undefined, opts?: { fmt?: 'currency' | 'pct' | 'number' | 'ratio' | 'eps'; dim?: boolean; italic?: boolean; neg?: boolean }) => {
    const fmt = opts?.fmt ?? 'currency';
    const dim = opts?.dim ?? false;
    const italic = opts?.italic ?? false;
    const neg = opts?.neg ?? false;
    const cls = [
      'border-b border-slate-700/50',
      dim ? 'text-slate-500' : '',
      italic ? 'text-xs italic text-slate-400' : '',
    ].filter(Boolean).join(' ');
    return (
      <tr className={cls}>
        <td className="text-left py-2 text-slate-300">{label}</td>
        {h.map((p: any) => {
          const v = getter(p);
          if (v == null || (v === 0 && fmt !== 'pct' && fmt !== 'ratio' && fmt !== 'eps')) {
            return <td key={p.year} className="py-2">-</td>;
          }
          let display: string;
          if (fmt === 'pct') display = formatPct(v);
          else if (fmt === 'ratio') display = v.toFixed(2);
          else if (fmt === 'eps') display = `$${v.toFixed(2)}`;
          else if (fmt === 'number') display = formatModelNumber(v, formatUnit);
          else display = neg ? `(${formatModelCurrency(Math.abs(v), formatUnit)})` : formatModelCurrency(v, formatUnit);
          return <td key={p.year} className={`py-2${neg ? ' text-red-400' : ''}`}>{display}</td>;
        })}
      </tr>
    );
  };

  const sectionHeader = (title: string, colSpan: number) => (
    <tr className="border-b border-slate-600"><td colSpan={colSpan} className="text-left py-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">{title}</td></tr>
  );

  const cols = h.length + 1;

  return (
    <div className="space-y-6">
      {showTitle && <h2 className="text-xl font-semibold">Historical Financials</h2>}

      {/* Income Statement */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-lg font-medium mb-4">Income Statement</h3>
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 font-medium">Metric</th>
              {h.map((p: any) => <th key={p.year} className="py-2 font-medium">{p.year}</th>)}
            </tr>
          </thead>
          <tbody className="font-mono text-base">
            {row('Revenue', p => p.rev)}
            {row('Revenue Growth', p => p.revGrowth, { fmt: 'pct', italic: true })}
            {row('Cost of Revenue', p => p.cogs, { dim: true })}
            {row('Gross Profit', p => p.gp)}
            {row('Gross Margin', p => p.gpm, { fmt: 'pct', italic: true })}
            {sectionHeader('Operating Expenses', cols)}
            {row('R&D', p => p.rd, { dim: true })}
            {row('SG&A', p => p.sga, { dim: true })}
            {row('Other Expenses', p => p.otherExpenses, { dim: true })}
            {row('Total Operating Expenses', p => p.operatingExpenses, { dim: true })}
            {sectionHeader('Operating Income', cols)}
            {row('EBIT (Operating Income)', p => p.ebit)}
            {row('EBIT Margin', p => p.ebitMargin, { fmt: 'pct', italic: true })}
            {row('D&A', p => p.dna, { dim: true })}
            {row('EBITDA', p => p.ebitda)}
            {row('EBITDA Margin', p => p.ebitdaMargin, { fmt: 'pct', italic: true })}
            {sectionHeader('Below the Line', cols)}
            {row('Interest Income', p => p.interestIncome, { dim: true })}
            {row('Interest Expense', p => p.interestExpense, { dim: true })}
            {row('Income Before Tax', p => p.incomeBeforeTax)}
            {row('Income Tax', p => p.tax, { dim: true })}
            {row('Net Income', p => p.netIncome)}
            {row('Net Profit Margin', p => p.netProfitMargin, { fmt: 'pct', italic: true })}
            {sectionHeader('Per Share', cols)}
            {row('Basic EPS', p => p.eps, { fmt: 'eps' })}
            {row('Diluted EPS', p => p.epsDiluted, { fmt: 'eps' })}
            {row('Shares Outstanding', p => p.shares, { fmt: 'number' })}
            {row('Shares Diluted', p => p.sharesDiluted, { fmt: 'number' })}
          </tbody>
        </table>
      </div>

      {/* Balance Sheet */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-lg font-medium mb-4">Balance Sheet</h3>
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 font-medium">Metric</th>
              {h.map((p: any) => <th key={p.year} className="py-2 font-medium">{p.year}</th>)}
            </tr>
          </thead>
          <tbody className="font-mono text-base">
            {sectionHeader('Current Assets', cols)}
            {row('Cash & Equivalents', p => p.cashAndCashEquivalents, { dim: true })}
            {row('Short-Term Investments', p => p.shortTermInvestments, { dim: true })}
            {row('Cash & Short-Term Investments', p => p.cashAndShortTermInvestments)}
            {row('Net Receivables', p => p.netReceivables, { dim: true })}
            {row('Inventory', p => p.inventory, { dim: true })}
            {row('Other Current Assets', p => p.otherCurrentAssets, { dim: true })}
            {row('Total Current Assets', p => p.totalCurrentAssets)}
            {sectionHeader('Non-Current Assets', cols)}
            {row('PP&E (Net)', p => p.ppNet, { dim: true })}
            {row('Goodwill', p => p.goodwill, { dim: true })}
            {row('Intangible Assets', p => p.intangibleAssets, { dim: true })}
            {row('Long-Term Investments', p => p.longTermInvestments, { dim: true })}
            {row('Total Non-Current Assets', p => p.totalNonCurrentAssets)}
            {row('Total Assets', p => p.totalAssets)}
            {sectionHeader('Current Liabilities', cols)}
            {row('Accounts Payable', p => p.accountPayables, { dim: true })}
            {row('Short-Term Debt', p => p.shortTermDebt, { dim: true })}
            {row('Deferred Revenue', p => p.deferredRevenue, { dim: true })}
            {row('Other Current Liabilities', p => p.otherCurrentLiabilities, { dim: true })}
            {row('Total Current Liabilities', p => p.totalCurrentLiabilities)}
            {sectionHeader('Non-Current Liabilities', cols)}
            {row('Long-Term Debt', p => p.longTermDebt, { dim: true })}
            {row('Total Non-Current Liabilities', p => p.totalNonCurrentLiabilities)}
            {row('Total Liabilities', p => p.totalLiabilities)}
            {sectionHeader('Equity', cols)}
            {row('Total Stockholders Equity', p => p.totalStockholdersEquity)}
            {row('Total Equity', p => p.totalEquity)}
            {sectionHeader('Summary', cols)}
            {row('Total Debt', p => p.totalDebt)}
            {row('Net Debt', p => p.netDebt)}
            {row('Working Capital', p => p.wc)}
          </tbody>
        </table>
      </div>

      {/* Cash Flow */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-lg font-medium mb-4">Cash Flow Statement</h3>
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 font-medium">Metric</th>
              {h.map((p: any) => <th key={p.year} className="py-2 font-medium">{p.year}</th>)}
            </tr>
          </thead>
          <tbody className="font-mono text-base">
            {sectionHeader('Operating Activities', cols)}
            {row('Net Income', p => p.cfNetIncome)}
            {row('D&A', p => p.cfDna, { dim: true })}
            {row('Stock-Based Compensation', p => p.stockBasedCompensation, { dim: true })}
            {row('Change in Working Capital', p => p.changeInWorkingCapital, { dim: true })}
            {row('Cash from Operations (CFO)', p => p.cfo)}
            {sectionHeader('Investing Activities', cols)}
            {row('Capital Expenditures', p => p.capex, { neg: true })}
            {row('Acquisitions (Net)', p => p.acquisitionsNet, { dim: true })}
            {row('Purchases of Investments', p => p.purchasesOfInvestments, { dim: true })}
            {row('Sales/Maturities of Investments', p => p.salesMaturitiesOfInvestments, { dim: true })}
            {row('Cash from Investing (CFI)', p => p.cfi)}
            {sectionHeader('Financing Activities', cols)}
            {row('Debt Repayment', p => p.debtRepayment, { dim: true, neg: true })}
            {row('Stock Repurchased', p => p.commonStockRepurchased, { dim: true })}
            {row('Dividends Paid', p => p.dividendsPaid, { dim: true, neg: true })}
            {row('Cash from Financing (CFF)', p => p.cff)}
            {sectionHeader('Summary', cols)}
            {row('Free Cash Flow', p => p.freeCashFlow)}
            {row('Net Change in Cash', p => p.changeInCash)}
          </tbody>
        </table>
      </div>

      {/* Key Ratios */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-lg font-medium mb-4">Key Ratios</h3>
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 font-medium">Metric</th>
              {h.map((p: any) => <th key={p.year} className="py-2 font-medium">{p.year}</th>)}
            </tr>
          </thead>
          <tbody className="font-mono text-base">
            {sectionHeader('Liquidity', cols)}
            {row('Current Ratio', p => p.currentRatio, { fmt: 'ratio' })}
            {row('Quick Ratio', p => p.quickRatio, { fmt: 'ratio' })}
            {sectionHeader('Leverage', cols)}
            {row('Debt / Equity', p => p.debtToEquity, { fmt: 'ratio' })}
            {row('Interest Coverage', p => p.interestCoverage, { fmt: 'ratio' })}
            {sectionHeader('Profitability', cols)}
            {row('Gross Margin', p => p.grossMargin, { fmt: 'pct' })}
            {row('EBIT Margin', p => p.ebitMargin, { fmt: 'pct' })}
            {row('Net Profit Margin', p => p.profitMargin, { fmt: 'pct' })}
            {row('ROE', p => p.roe, { fmt: 'pct' })}
            {row('ROA', p => p.roa, { fmt: 'pct' })}
            {row('Effective Tax Rate', p => p.taxRate, { fmt: 'pct' })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
