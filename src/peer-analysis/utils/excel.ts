/* ── Peer Analysis — Excel Export ─────────────────────────────────────── */

import * as XLSX from 'xlsx';
import type { PeerData, AllStats } from '../types';
import { formatCurrency, formatPct, fmtX } from './formatters';

export function exportToExcel(data: PeerData[], stats: AllStats, ticker: string): void {
    if (data.length === 0) return;

    const headers = [
        'Company', 'Symbol', 'Rev Growth', 'EBITDA', 'EBITDA %', 'Net Income', 'NI %',
        'Price', 'Market Cap', 'EV', 'EV/Rev', 'EV/EBITDA', 'P/Sales', 'P/E', 'P/Book', 'P/FCF',
    ];

    const rows = data.map(d => [
        d.name ?? '', d.symbol ?? '', formatPct(d.revGrowth), formatCurrency(d.ebitda),
        formatPct(d.ebitdaMargin), formatCurrency(d.netIncome), formatPct(d.niMargin),
        `$${d.price.toFixed(2)}`, formatCurrency(d.marketCap), formatCurrency(d.ev),
        fmtX(d.evToRev), fmtX(d.evToEbitda), fmtX(d.pToSales), fmtX(d.pToE),
        fmtX(d.pToBook), fmtX(d.pToFCF),
    ]);

    const makeStatRow = (label: string, key: 'mean' | 'median' | 'p25' | 'p75') => [
        label, '', formatPct(stats.revGrowth[key]), formatCurrency(stats.ebitda[key]),
        formatPct(stats.ebitdaMargin[key]), formatCurrency(stats.netIncome[key]),
        formatPct(stats.niMargin[key]), `$${stats.price[key].toFixed(2)}`,
        formatCurrency(stats.marketCap[key]), formatCurrency(stats.ev[key]),
        fmtX(stats.evToRev[key]), fmtX(stats.evToEbitda[key]), fmtX(stats.pToSales[key]),
        fmtX(stats.pToE[key]), fmtX(stats.pToBook[key]), fmtX(stats.pToFCF[key]),
    ];

    const ws = XLSX.utils.aoa_to_sheet([
        headers, ...rows, [],
        makeStatRow('Mean', 'mean'),
        makeStatRow('Median', 'median'),
        makeStatRow('25th Percentile', 'p25'),
        makeStatRow('75th Percentile', 'p75'),
    ]);

    ws['!cols'] = [
        { wch: 28 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 14 },
        { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Peer Analysis');
    XLSX.writeFile(wb, `peer_analysis_${ticker}_${new Date().toISOString().substring(0, 10)}.xlsx`);
}
