import type { DCFResult, DCFInputs, ScenarioType, ScenarioComparison } from '../types';

export interface PrintDCFArgs {
  dcf: DCFResult;
  ticker: string;
  profileName: string;
  activeScenario: ScenarioType;
  inputs: DCFInputs;
  formatUnit: 'M' | 'B';
  scenarioComparison: ScenarioComparison | null;
}

export function printDCF(args: PrintDCFArgs) {
  const { dcf, ticker, profileName, activeScenario, inputs, formatUnit, scenarioComparison } = args;
  const {
    revGrowthStart, revGrowthEnd, ebitMarginStart, ebitMarginEnd,
    termGrowth, waccAdj, erp, dnaMarginProj, wcMarginProj,
    capexMarginProj, sharesGrowthProj, forecastYears,
  } = inputs;

  const fmtM = (v: number) => {
    const neg = v < 0; const abs = Math.abs(v);
    if (abs >= 1e9) return `${neg ? '-' : ''}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${neg ? '-' : ''}$${(abs / 1e6).toFixed(2)}M`;
    return `${neg ? '-' : ''}$${abs.toFixed(0)}`;
  };
  const fmtP = (v: number) => `${(v * 100).toFixed(1)}%`;
  const scenarioLabel = activeScenario !== 'custom'
    ? activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1) + ' Case' : 'Custom';
  const companyNameStr = profileName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const histCols = dcf.historicalSummary.map((h: any) => `<th class="hist-h">${h.year.substring(0, 4)}</th>`).join('');
  const projCols = dcf.projections.map((pr: any) => `<th class="proj-h">${pr.year}</th>`).join('');
  const rowFromArrays = (label: string, histVals: string[], projVals: string[]) =>
    `<tr><td class="row-label">${label}</td>${histVals.map(v => `<td class="hist-v">${v}</td>`).join('')}${projVals.map(v => `<td class="proj-v">${v}</td>`).join('')}</tr>`;
  const pvLast = dcf.projections[dcf.projections.length - 1].discountedTv;
  const sensRows = dcf.sensitivityMatrix.map((row: (number | null)[], ri: number) => {
    const g = dcf.growthSteps[ri];
    const isCurG = Math.abs(g - termGrowth / 100) < 0.0001;
    const cells = row.map((iv: number | null, ci: number) => {
      const w = dcf.waccSteps[ci];
      const isCurW = Math.abs(w - dcf.wacc) < 0.0001;
      const cls = [isCurW ? 'cur-w' : '', iv !== null && iv > dcf.currentPrice ? 'up' : iv !== null ? 'dn' : ''].filter(Boolean).join(' ');
      return `<td class="${cls}">${iv !== null ? '$' + iv.toFixed(0) : '&mdash;'}</td>`;
    }).join('');
    return `<tr><th class="g-th${isCurG ? ' cur-g' : ''}">${(g * 100).toFixed(1)}%</th>${cells}</tr>`;
  }).join('');
  const waccHdrs = dcf.waccSteps.map((w: number) =>
    `<th class="${Math.abs(w - dcf.wacc) < 0.0001 ? 'cur-w-h' : ''}">${(w * 100).toFixed(1)}%</th>`).join('');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${ticker} DCF &mdash; ValuWise</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#1e293b;background:#fff;padding:40px 48px;font-size:12px;line-height:1.5}.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e2e8f0}.logo{font-size:16px;font-weight:800;color:#0f172a}.logo em{color:#10b981;font-style:normal}.title{font-size:22px;font-weight:700;color:#0f172a;margin-top:5px}.subtitle{font-size:12px;color:#64748b;margin-top:2px}.hdr-r{text-align:right;color:#64748b;font-size:11px;line-height:2}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px}.card{border:1px solid #d1d5db;border-radius:9px;padding:14px 16px}.card-lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}.card-val{font-size:24px;font-weight:300;color:#0f172a;letter-spacing:-.5px}.card-sub{font-size:10px;color:#94a3b8;margin-top:3px}.up{color:#059669}.dn{color:#dc2626}h2{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin:22px 0 10px;padding-bottom:5px;border-bottom:1px solid #f1f5f9}.asm{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}.asm-r{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e5e7eb}.asm-k{color:#64748b}.asm-v{font-weight:600;color:#0f172a;font-family:monospace}table{width:100%;border-collapse:collapse;font-size:11px;border:1px solid #d1d5db}th,td{padding:5px 9px;text-align:right;border:1px solid #d1d5db}th{background:#f1f5f9;font-weight:600;color:#374151;font-size:10px}.hist-h,.hist-v{color:#94a3b8}.proj-h,.proj-v{color:#0f172a}.row-label{text-align:left;font-weight:500;color:#374151;min-width:110px}.sum-t{width:46%;border:1px solid #d1d5db}.sum-t td{padding:4px 9px;border:1px solid #d1d5db}.sum-t td:last-child{text-align:right;font-family:monospace;font-weight:500}.sum-tot td{border-top:2px solid #6b7280;font-weight:700;font-size:13px;background:#f8fafc}.sens th,.sens td{padding:4px 7px;border:1px solid #d1d5db;font-size:10px;text-align:center;font-family:monospace}.sens .g-th{background:#f8fafc;font-weight:600;color:#475569}.sens .g-th.cur-g{color:#059669;font-weight:700}.sens .cur-w-h{background:#dcfce7;color:#14532d}.sens .cur-w{border-left:2px solid #16a34a;border-right:2px solid #16a34a}.sens .up{color:#059669}.sens .dn{color:#dc2626}.footer{margin-top:28px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;line-height:1.6}@media print{body{padding:24px 30px}h2{margin-top:16px}}</style></head><body>
<div class="hdr"><div><div class="logo">Valu<em>Wise</em></div><div class="title">${ticker} &mdash; DCF Analysis</div><div class="subtitle">${companyNameStr} &nbsp;&bull;&nbsp; ${scenarioLabel}</div></div><div class="hdr-r"><div><strong>Date</strong>&nbsp; ${dateStr}</div><div><strong>Model</strong>&nbsp; Unlevered FCFF / Gordon Growth Terminal Value</div><div><strong>Data</strong>&nbsp; Finnhub</div></div></div>
<div class="cards"><div class="card"><div class="card-lbl">Intrinsic Value per Share</div><div class="card-val">$${dcf.intrinsicValue.toFixed(2)}</div><div class="card-sub">${forecastYears}-yr DCF &bull; ${scenarioLabel}</div></div><div class="card"><div class="card-lbl">Current Market Price</div><div class="card-val">$${dcf.currentPrice.toFixed(2)}</div><div class="card-sub">Market cap: ${fmtM(dcf.marketCap)}</div></div><div class="card"><div class="card-lbl">Upside / Downside</div><div class="card-val ${dcf.upside >= 0 ? 'up' : 'dn'}">${dcf.upside >= 0 ? '+' : ''}${(dcf.upside * 100).toFixed(1)}%</div><div class="card-sub">${dcf.upside >= 0 ? 'Undervalued vs intrinsic estimate' : 'Overvalued vs intrinsic estimate'}</div></div></div>
<h2>Key Assumptions</h2><div class="asm"><div><div class="asm-r"><span class="asm-k">Revenue Growth &mdash; Year 1</span><span class="asm-v">${revGrowthStart}%</span></div><div class="asm-r"><span class="asm-k">Revenue Growth &mdash; Year ${forecastYears}</span><span class="asm-v">${revGrowthEnd}%</span></div><div class="asm-r"><span class="asm-k">EBIT Margin &mdash; Year 1</span><span class="asm-v">${ebitMarginStart}%</span></div><div class="asm-r"><span class="asm-k">EBIT Margin &mdash; Year ${forecastYears}</span><span class="asm-v">${ebitMarginEnd}%</span></div><div class="asm-r"><span class="asm-k">D&A Margin</span><span class="asm-v">${dnaMarginProj}%</span></div><div class="asm-r"><span class="asm-k">NWC Margin</span><span class="asm-v">${wcMarginProj}%</span></div><div class="asm-r"><span class="asm-k">Capex Margin</span><span class="asm-v">${capexMarginProj}%</span></div></div><div><div class="asm-r"><span class="asm-k">Shares Growth</span><span class="asm-v">${sharesGrowthProj}%</span></div><div class="asm-r"><span class="asm-k">WACC</span><span class="asm-v">${fmtP(dcf.wacc)}</span></div><div class="asm-r"><span class="asm-k">Terminal Growth Rate</span><span class="asm-v">${termGrowth}%</span></div><div class="asm-r"><span class="asm-k">Forecast Period</span><span class="asm-v">${forecastYears} years</span></div><div class="asm-r"><span class="asm-k">Beta</span><span class="asm-v">${dcf.beta.toFixed(2)}</span></div></div></div>
${scenarioComparison ? `<h2>Scenario Comparison</h2><table><thead><tr><th style="text-align:left"></th><th class="dn">Bear Case</th><th>Base Case</th><th class="up">Bull Case</th></tr></thead><tbody><tr><td class="row-label">Implied Price</td><td class="dn">$${scenarioComparison.bear.price.toFixed(2)}</td><td>$${scenarioComparison.base.price.toFixed(2)}</td><td class="up">$${scenarioComparison.bull.price.toFixed(2)}</td></tr><tr><td class="row-label">vs Current ($${dcf.currentPrice.toFixed(2)})</td><td class="${scenarioComparison.bear.upside >= 0 ? 'up' : 'dn'}">${scenarioComparison.bear.upside >= 0 ? '+' : ''}${(scenarioComparison.bear.upside * 100).toFixed(1)}%</td><td class="${scenarioComparison.base.upside >= 0 ? 'up' : 'dn'}">${scenarioComparison.base.upside >= 0 ? '+' : ''}${(scenarioComparison.base.upside * 100).toFixed(1)}%</td><td class="${scenarioComparison.bull.upside >= 0 ? 'up' : 'dn'}">${scenarioComparison.bull.upside >= 0 ? '+' : ''}${(scenarioComparison.bull.upside * 100).toFixed(1)}%</td></tr><tr><td class="row-label">Enterprise Value</td><td>${fmtM(scenarioComparison.bear.ev)}</td><td>${fmtM(scenarioComparison.base.ev)}</td><td>${fmtM(scenarioComparison.bull.ev)}</td></tr></tbody></table>` : ''}
<h2>Forecast Model (${formatUnit})</h2><table><thead><tr><th style="text-align:left">Metric</th>${dcf.historicalSummary.slice(-3).map((h: any) => `<th class="hist-h">${h.year.substring(0, 4)}</th>`).join('')}${projCols}</tr></thead><tbody>${rowFromArrays('Revenue', dcf.historicalSummary.slice(-3).map((h: any) => fmtM(h.rev)), dcf.projections.map((pr: any) => fmtM(pr.rev)))}${rowFromArrays('EBIT', dcf.historicalSummary.slice(-3).map((h: any) => fmtM(h.ebit)), dcf.projections.map((pr: any) => fmtM(pr.ebit)))}${rowFromArrays('EBIT Margin', dcf.historicalSummary.slice(-3).map((h: any) => fmtP(h.ebitMargin)), dcf.projections.map((pr: any) => fmtP(pr.rev ? pr.ebit / pr.rev : 0)))}${rowFromArrays('Plus: D&A', dcf.historicalSummary.slice(-3).map((h: any) => fmtM(h.dna)), dcf.projections.map((pr: any) => fmtM(pr.dna)))}${rowFromArrays('Less: CapEx', dcf.historicalSummary.slice(-3).map((h: any) => `(${fmtM(h.capex)})`), dcf.projections.map((pr: any) => `(${fmtM(pr.capex)})`))}<tr><td class="row-label">NOPAT (EBIAT)</td>${dcf.historicalSummary.slice(-3).map(() => '<td class="hist-v">&mdash;</td>').join('')}${dcf.projections.map((pr: any) => `<td class="proj-v">${fmtM(pr.ebiat)}</td>`).join('')}</tr><tr><td class="row-label">FCFF</td>${dcf.historicalSummary.slice(-3).map((h: any) => `<td class="hist-v">${fmtM(h.fcff)}</td>`).join('')}${dcf.projections.map((pr: any) => `<td class="proj-v">${fmtM(pr.fcff)}</td>`).join('')}</tr><tr><td class="row-label">PV of FCFF</td>${dcf.historicalSummary.slice(-3).map(() => '<td class="hist-v">&mdash;</td>').join('')}${dcf.projections.map((pr: any) => `<td class="proj-v">${fmtM(pr.discountedFcff)}</td>`).join('')}</tr></tbody></table>
<h2>Valuation Bridge</h2><table class="sum-t"><tbody><tr><td>PV of FCFFs (${forecastYears}-yr)</td><td>${fmtM(dcf.ev - pvLast)}</td></tr><tr><td>PV of Terminal Value</td><td>${fmtM(pvLast)}</td></tr><tr><td>= Enterprise Value</td><td>${fmtM(dcf.ev)}</td></tr><tr><td>+ Cash &amp; Equivalents</td><td>${fmtM(dcf.totalCash)}</td></tr><tr><td>&minus; Total Debt</td><td>(${fmtM(dcf.totalDebt)})</td></tr><tr class="sum-tot"><td>= Equity Value</td><td>${fmtM(dcf.equityValue)}</td></tr><tr><td>Intrinsic Value / Share</td><td>$${dcf.intrinsicValue.toFixed(2)}</td></tr></tbody></table>
<h2>Sensitivity Analysis &mdash; Implied Share Price</h2><p style="font-size:10px;color:#64748b;margin-bottom:8px">Rows: Terminal growth &nbsp;&bull;&nbsp; Columns: WACC &nbsp;&bull;&nbsp; Green = upside vs market price &nbsp;&bull;&nbsp; Current WACC (${fmtP(dcf.wacc)}) highlighted</p><table class="sens"><thead><tr><th class="g-th">g / WACC</th>${waccHdrs}</tr></thead><tbody>${sensRows}</tbody></table>
<div class="footer"><strong>Disclaimer:</strong> This DCF analysis is provided by ValuWise for informational and educational purposes only. It does not constitute investment advice or a solicitation to buy or sell any security. All projections are based on historical data from Finnhub and user-defined assumptions. Conduct independent due diligence before making any investment decisions.</div>
<script>setTimeout(function(){ window.print(); }, 400);</script></body></html>`;
  const win = window.open('', '_blank', 'width=1050,height=800');
  if (!win) { alert('Please allow pop-ups for this site to open the PDF report.'); return; }
  win.document.write(html);
  win.document.close();
}
