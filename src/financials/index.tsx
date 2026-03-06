/* ── Financials — App Shell ───────────────────────────────────────────── */

import React, { useMemo } from 'react';
import { useFinancialsData } from './hooks/useFinancialsData';
import { computeIncomeMetrics, computeMarginTrends } from './calculations';

import FinancialsControls from './components/FinancialsControls';
import StatementTable from './components/StatementTable';
import StatementCharts from './components/StatementCharts';

export default function Financials() {
    const fin = useFinancialsData();

    /* ── Derived memos ──────────────────────────────────────────────── */

    const currentItems = useMemo(() => {
        if (!fin.data) return [];
        switch (fin.activeStatement) {
            case 'income': return fin.data.income_statement;
            case 'balance': return fin.data.balance_sheet;
            case 'cashflow': return fin.data.cash_flow;
            default: return [];
        }
    }, [fin.data, fin.activeStatement]);

    const statementTitle = useMemo(() => {
        switch (fin.activeStatement) {
            case 'income': return 'Income Statement';
            case 'balance': return 'Balance Sheet';
            case 'cashflow': return 'Cash Flow Statement';
            default: return '';
        }
    }, [fin.activeStatement]);

    const periods = useMemo(() => {
        return fin.data?.periods ?? [];
    }, [fin.data]);

    const incomeMetrics = useMemo(() => {
        if (!fin.data?.income_statement.length || !periods.length) return [];
        return computeIncomeMetrics(fin.data.income_statement, periods);
    }, [fin.data, periods]);

    const marginTrends = useMemo(() => {
        if (!fin.data?.income_statement.length || !periods.length) return [];
        return computeMarginTrends(fin.data.income_statement, periods);
    }, [fin.data, periods]);

    /* ── Render ─────────────────────────────────────────────────────── */

    return (
        <div className="space-y-6">
            <FinancialsControls
                tickerInput={fin.tickerInput}
                onTickerInputChange={fin.setTickerInput}
                onSearch={fin.handleSearch}
                activeStatement={fin.activeStatement}
                onStatementChange={fin.setActiveStatement}
                loading={fin.loading}
                error={fin.error}
                hasData={!!fin.data}
                companyName={fin.data?.company_name ?? ''}
                ticker={fin.ticker}
            />

            {fin.data && !fin.loading && (
                <>
                    {/* Charts (only for Income Statement view) */}
                    {fin.activeStatement === 'income' && (
                        <StatementCharts
                            incomeMetrics={incomeMetrics}
                            marginTrends={marginTrends}
                        />
                    )}

                    {/* Statement table */}
                    <StatementTable
                        items={currentItems}
                        periods={periods}
                        title={statementTitle}
                    />
                </>
            )}
        </div>
    );
}
