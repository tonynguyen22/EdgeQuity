import React from 'react';
import { formatModelCurrency, formatModelNumber, formatPct } from '../utils/formatters';
import type { DCFResult, FormatUnit } from '../types';

interface HistoricalTablesProps {
  dcf: DCFResult;
  formatUnit: FormatUnit;
}

export default function HistoricalTables({ dcf, formatUnit }: HistoricalTablesProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Historical Financials</h2>

      {/* Income Statement */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-lg font-medium mb-4">Income Statement</h3>
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 font-medium">Metric</th>
              {dcf.historicalSummary.map((p: any) => <th key={p.year} className="py-2 font-medium">{p.year}</th>)}
            </tr>
          </thead>
          <tbody className="font-mono text-base">
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Revenue</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.rev, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-xs italic text-slate-400"><td className="text-left py-2">Revenue Growth</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatPct(p.revGrowth)}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-slate-500"><td className="text-left py-2">Cost of Revenue</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{p.cogs ? formatModelCurrency(p.cogs, formatUnit) : '-'}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Gross Profit</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.gp, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-xs italic text-slate-400"><td className="text-left py-2">Gross Margin</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatPct(p.gpm)}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-slate-500"><td className="text-left py-2">SG&A</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{p.sga ? formatModelCurrency(p.sga, formatUnit) : '-'}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-slate-500"><td className="text-left py-2">R&D</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{p.rd ? formatModelCurrency(p.rd, formatUnit) : '-'}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-slate-500"><td className="text-left py-2">D&A</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{p.dna ? formatModelCurrency(p.dna, formatUnit) : '-'}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">EBIT</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.ebit, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-xs italic text-slate-400"><td className="text-left py-2">EBIT Margin</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatPct(p.ebitMargin)}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">EBITDA</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.ebitda, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-xs italic text-slate-400"><td className="text-left py-2">EBITDA Margin</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatPct(p.ebitdaMargin)}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-slate-500"><td className="text-left py-2">Interest Expense</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{p.interestExpense ? formatModelCurrency(p.interestExpense, formatUnit) : '-'}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-slate-500"><td className="text-left py-2">Income Tax</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{p.tax ? formatModelCurrency(p.tax, formatUnit) : '-'}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Net Income</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.netIncome, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50 text-xs italic text-slate-400"><td className="text-left py-2">Net Profit Margin</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatPct(p.netProfitMargin)}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Basic EPS</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">${p.eps.toFixed(2)}</td>)}</tr>
            <tr><td className="text-left py-2 text-slate-300">Shares Outstanding</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelNumber(p.shares, formatUnit)}</td>)}</tr>
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
              {dcf.historicalSummary.map((p: any) => <th key={p.year} className="py-2 font-medium">{p.year}</th>)}
            </tr>
          </thead>
          <tbody className="font-mono text-base">
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Total Assets</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.totalAssets, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Total Liabilities</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.totalLiabilities, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Total Debt</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.totalDebt, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Total Equity</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.totalEquity, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Cash & Equivalents</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.cash, formatUnit)}</td>)}</tr>
            <tr><td className="text-left py-2 text-slate-300">Working Capital</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.wc, formatUnit)}</td>)}</tr>
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
              {dcf.historicalSummary.map((p: any) => <th key={p.year} className="py-2 font-medium">{p.year}</th>)}
            </tr>
          </thead>
          <tbody className="font-mono text-base">
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Cash from Operations (CFO)</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.cfo, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Cash from Investing (CFI)</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.cfi, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Cash from Financing (CFF)</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.cff, formatUnit)}</td>)}</tr>
            <tr className="border-b border-slate-700/50"><td className="text-left py-2 text-slate-300">Capital Expenditures</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2 text-red-400">({formatModelCurrency(p.capex, formatUnit)})</td>)}</tr>
            <tr><td className="text-left py-2 text-slate-300">Change in Cash</td>{dcf.historicalSummary.map((p: any) => <td key={p.year} className="py-2">{formatModelCurrency(p.changeInCash, formatUnit)}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
