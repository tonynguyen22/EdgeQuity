import React from 'react';
import { Printer, Download } from 'lucide-react';
import { formatModelCurrency, formatModelNumber, formatPct } from '../utils/formatters';
import type { DCFResult, FormatUnit } from '../types';

interface ForecastTableProps {
  dcf: DCFResult;
  formatUnit: FormatUnit;
  forecastYears: number;
  onFormatUnitChange: (unit: FormatUnit) => void;
  onPrint: () => void;
  onExport: () => void;
}

export default function ForecastTable({ dcf, formatUnit, forecastYears, onFormatUnitChange, onPrint, onExport }: ForecastTableProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Forecast Model</h3>
        <div className="flex gap-4">
          <div className="flex bg-slate-800 rounded-md p-1 border border-slate-700">
            <button onClick={() => onFormatUnitChange('M')} className={`px-3 py-1 text-xs rounded-sm ${formatUnit === 'M' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>M</button>
            <button onClick={() => onFormatUnitChange('B')} className={`px-3 py-1 text-xs rounded-sm ${formatUnit === 'B' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>B</button>
          </div>
          <button
            onClick={onPrint}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-sm px-4 py-2 rounded-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-sm px-4 py-2 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Financials
          </button>
        </div>
      </div>
      <table className="w-full text-sm text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-2 px-3 font-medium min-w-[120px]">Metric</th>
            {dcf.historicalSummary.slice(-3).map((p: any) => <th key={p.year} className="py-2 px-3 font-medium text-slate-500 min-w-[85px] whitespace-nowrap">{p.year}</th>)}
            {dcf.projections.map((p: any) => <th key={p.year} className="py-2 px-3 font-medium min-w-[85px] whitespace-nowrap">{p.year}</th>)}
          </tr>
        </thead>
        <tbody className="font-mono text-base">
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">Revenue</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatModelCurrency(p.rev, formatUnit)}</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className="py-3 px-3 whitespace-nowrap">{formatModelCurrency(p.rev, formatUnit)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">EBIT</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatModelCurrency(p.ebit, formatUnit)}</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className={`py-3 px-3 whitespace-nowrap ${p.ebit < 0 ? 'text-red-400' : ''}`}>{formatModelCurrency(p.ebit, formatUnit)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50 text-sm italic text-slate-400">
            <td className="text-left py-3 px-3 whitespace-nowrap">(1 - Tax)</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3">-</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className="py-3 px-3 whitespace-nowrap">{formatPct(1 - p.taxRate)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">EBIAT (NOPAT)</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-600">-</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className={`py-3 px-3 whitespace-nowrap ${p.ebiat < 0 ? 'text-red-400' : ''}`}>{formatModelCurrency(p.ebiat, formatUnit)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">Plus: D&A</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatModelCurrency(p.dna, formatUnit)}</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className="py-3 px-3 whitespace-nowrap">{formatModelCurrency(p.dna, formatUnit)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">Less: CapEx</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-red-400 whitespace-nowrap">{formatModelCurrency(-p.capex, formatUnit)}</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className="py-3 px-3 text-red-400 whitespace-nowrap">{formatModelCurrency(-p.capex, formatUnit)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">Less: Δ WC</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-600">-</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className={`py-3 px-3 whitespace-nowrap ${p.deltaWc > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatModelCurrency(-p.deltaWc, formatUnit)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-4 px-3 text-slate-300 font-semibold whitespace-nowrap">Free Cash Flow</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-4 px-3 text-slate-500 whitespace-nowrap">{formatModelCurrency(p.fcff, formatUnit)}</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className={`py-4 px-3 font-semibold whitespace-nowrap ${p.fcff < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatModelCurrency(p.fcff, formatUnit)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">Mid-Year DP</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-600">-</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-400 whitespace-nowrap">{p.discountPeriod.toFixed(2)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">Discounted FCF</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-600">-</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className={`py-3 px-3 whitespace-nowrap ${p.discountedFcff < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatModelCurrency(p.discountedFcff, formatUnit)}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">Terminal Value</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-600">-</td>)}
            {dcf.projections.map((p: any, i: number) => <td key={p.year} className="py-3 px-3 whitespace-nowrap">{i === dcf.projections.length - 1 ? formatModelCurrency(p.tv, formatUnit) : '-'}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">Discounted TV</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-600">-</td>)}
            {dcf.projections.map((p: any, i: number) => <td key={p.year} className={`py-3 px-3 whitespace-nowrap ${p.discountedTv < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{i === dcf.projections.length - 1 ? formatModelCurrency(p.discountedTv, formatUnit) : '-'}</td>)}
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 px-3 text-slate-300 whitespace-nowrap">Shares Outstanding</td>
            {dcf.historicalSummary.slice(-3).map((p: any) => <td key={p.year} className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatModelNumber(p.shares, formatUnit)}</td>)}
            {dcf.projections.map((p: any) => <td key={p.year} className="py-3 px-3 whitespace-nowrap">{formatModelNumber(p.shares, formatUnit)}</td>)}
          </tr>

          {/* Valuation Summary Rows */}
          <tr className="border-t-2 border-slate-600">
            <td className="text-left py-3 text-slate-300 font-semibold">Enterprise Value</td>
            <td colSpan={3 + dcf.projections.length} className="py-3 font-semibold text-emerald-400">{formatModelCurrency(dcf.ev, formatUnit)}</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 text-slate-300">Plus: Cash</td>
            <td colSpan={dcf.historicalSummary.length + dcf.projections.length} className="py-3">{formatModelCurrency(dcf.totalCash, formatUnit)}</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 text-slate-300">Less: Debt</td>
            <td colSpan={dcf.historicalSummary.length + dcf.projections.length} className="py-3 text-red-400">({formatModelCurrency(dcf.totalDebt, formatUnit)})</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 text-slate-300">Equity Value</td>
            <td colSpan={dcf.historicalSummary.length + dcf.projections.length} className="py-3 text-emerald-400">{formatModelCurrency(dcf.equityValue, formatUnit)}</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="text-left py-3 text-slate-300">Diluted Shares (Year {forecastYears})</td>
            <td colSpan={dcf.historicalSummary.length + dcf.projections.length} className="py-3">{formatModelNumber(dcf.terminalShares, formatUnit)}</td>
          </tr>
          <tr className="font-bold text-lg">
            <td className="text-left py-4 text-slate-200">Implied Price per Share</td>
            <td colSpan={dcf.historicalSummary.length + dcf.projections.length} className="py-4 text-emerald-400">${dcf.intrinsicValue.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
