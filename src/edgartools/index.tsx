/* ── EdgarTools — Financial Statements via Python API ────────────────── */

import { useMemo } from 'react';
import { useEdgarToolsData } from './hooks/useEdgarToolsData';

import FinancialsControls from '../financials/components/FinancialsControls';
import StatementTable from '../financials/components/StatementTable';

export default function EdgarTools() {
    const fin = useEdgarToolsData();

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

    const periods = useMemo(() => fin.data?.periods ?? [], [fin.data]);

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
                <StatementTable
                    items={currentItems}
                    periods={periods}
                    title={statementTitle}
                />
            )}
        </div>
    );
}
