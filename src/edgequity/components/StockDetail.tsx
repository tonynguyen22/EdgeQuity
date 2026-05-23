import { useState } from 'react';
import type { ReactNode } from 'react';

import { getEdgequityAnalysisNote } from '../analysis';
import { EDGEQUITY_COLUMNS, formatEdgequityValue, getColumnValue } from '../metrics';
import type { EdgequityAnalysisNote, EdgequityColumn, EdgequityMetricGroup, EdgequityResearchReportNote, EdgequityStockRecord } from '../types';

import FundamentalsPanel from './FundamentalsPanel';
import ReportedFinancialsPanel from './ReportedFinancialsPanel';

interface StockDetailProps {
  stock: EdgequityStockRecord;
  onBack: () => void;
}

interface MetricGroupDefinition {
  id: Exclude<EdgequityMetricGroup, 'profile'>;
  label: string;
}

const METRIC_GROUPS: MetricGroupDefinition[] = [
  { id: 'valuation', label: 'Valuation' },
  { id: 'margin', label: 'Margin' },
  { id: 'profitability', label: 'Profitability' },
  { id: 'growth', label: 'Growth' },
  { id: 'financialHealth', label: 'Financial health' },
  { id: 'cashFlow', label: 'Cash flow' },
  { id: 'dividends', label: 'Dividends' },
];

const REPORT_HISTORY_FIELDS = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'grossProfit', label: 'Gross Profit' },
  { id: 'operatingIncome', label: 'Operating Income' },
  { id: 'netIncome', label: 'Net Income' },
  { id: 'freeCashFlow', label: 'Free Cash Flow' },
] as const;

type ReportHistoryField = (typeof REPORT_HISTORY_FIELDS)[number]['id'];

function getGroupColumns(group: EdgequityMetricGroup): EdgequityColumn[] {
  return EDGEQUITY_COLUMNS.filter((column) => column.group === group);
}

export default function StockDetail({ stock, onBack }: StockDetailProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'financials' | 'statements' | 'fundamentals'>('analysis');
  const sectorLine = [stock.sector, stock.industry].filter(Boolean).join(' / ') || 'Classification unavailable';
  const analysisNote = getEdgequityAnalysisNote(stock.ticker);

  return (
    <div className="space-y-3">
      <button type="button" className="eq-back-button" onClick={onBack}>
        Back to screener
      </button>

      <section className="eq-detail-hero">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase text-[var(--vw-accent)]">{stock.ticker}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">{stock.name}</h2>
          <p className="mt-1 text-sm text-[var(--vw-text-secondary)]">{sectorLine}</p>
        </div>
        <div className="eq-kpi-strip">
          <HeaderMetric label="Price" value={`${stock.currency ?? 'USD'} ${formatEdgequityValue(stock.price, 'number')}`} />
          <HeaderMetric label="Market Cap" value={formatEdgequityValue(stock.marketCap, 'money')} />
          <HeaderMetric label="Enterprise Value" value={formatEdgequityValue(stock.enterpriseValue, 'money')} />
          <HeaderMetric label="FCF Yield" value={formatEdgequityValue(stock.valuation.fcfYield, 'percent')} highlight />
        </div>
      </section>

      {stock.warnings.length > 0 && (
        <section className="eq-note-panel">
          <h3>Investment notes</h3>
          <ul>
            {stock.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="eq-detail-tabs" role="tablist" aria-label={`${stock.ticker} detail views`}>
        <button
          type="button"
          role="tab"
          id="edgequity-analysis-tab"
          aria-controls="edgequity-analysis-panel"
          aria-selected={activeTab === 'analysis'}
          className={activeTab === 'analysis' ? 'is-active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          AI Analysis
        </button>
        <button
          type="button"
          role="tab"
          id="edgequity-financials-tab"
          aria-controls="edgequity-financials-panel"
          aria-selected={activeTab === 'financials'}
          className={activeTab === 'financials' ? 'is-active' : ''}
          onClick={() => setActiveTab('financials')}
        >
          Financials
        </button>
        <button
          type="button"
          role="tab"
          id="edgequity-statements-tab"
          aria-controls="edgequity-statements-panel"
          aria-selected={activeTab === 'statements'}
          className={activeTab === 'statements' ? 'is-active' : ''}
          onClick={() => setActiveTab('statements')}
        >
          Statements
        </button>
        <button
          type="button"
          role="tab"
          id="edgequity-fundamentals-tab"
          aria-controls="edgequity-fundamentals-panel"
          aria-selected={activeTab === 'fundamentals'}
          className={activeTab === 'fundamentals' ? 'is-active' : ''}
          onClick={() => setActiveTab('fundamentals')}
        >
          Fundamentals
        </button>
      </div>

      <section
        id="edgequity-analysis-panel"
        role="tabpanel"
        aria-labelledby="edgequity-analysis-tab"
        hidden={activeTab !== 'analysis'}
      >
        <AnalysisPanel stock={stock} note={analysisNote} />
      </section>

      <section
        id="edgequity-financials-panel"
        role="tabpanel"
        aria-labelledby="edgequity-financials-tab"
        hidden={activeTab !== 'financials'}
      >
        <FinancialsOverview stock={stock} />
      </section>

      <section
        id="edgequity-statements-panel"
        role="tabpanel"
        aria-labelledby="edgequity-statements-tab"
        hidden={activeTab !== 'statements'}
      >
        <ReportedFinancialsPanel ticker={stock.ticker} />
      </section>

      <section
        id="edgequity-fundamentals-panel"
        role="tabpanel"
        aria-labelledby="edgequity-fundamentals-tab"
        hidden={activeTab !== 'fundamentals'}
      >
        <FundamentalsPanel ticker={stock.ticker} />
      </section>
    </div>
  );
}

function AnalysisPanel({ stock, note }: { stock: EdgequityStockRecord; note: EdgequityAnalysisNote | null }) {
  if (note === null) {
    return (
      <article className="eq-analysis-panel">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--vw-accent)]">AI Analysis</p>
          <h3 className="mt-1 text-lg font-semibold">{stock.ticker} research note</h3>
        </div>
        <p className="mt-3 text-sm text-[var(--vw-text-secondary)]">
          AI analysis is queued for this ticker. Financial data is available below.
        </p>
      </article>
    );
  }

  return <TonivestResearchReport stock={stock} note={note} />;
}

function TonivestResearchReport({ stock, note }: { stock: EdgequityStockRecord; note: EdgequityAnalysisNote }) {
  const latestYear = stock.history[0];
  const fiveYearHistory = getFiveYearHistory(stock);
  const historyPeriodLabel = getHistoryPeriodLabel(fiveYearHistory);
  const revenueSeries = fiveYearHistory.map((year) => ({ label: year.year, value: year.revenue }));
  const fcfSeries = fiveYearHistory.map((year) => ({ label: year.year, value: year.freeCashFlow }));
  const grossMarginSeries = fiveYearHistory.map((year) => ({ label: year.year, value: ratio(year.grossProfit, year.revenue) }));
  const operatingMarginSeries = fiveYearHistory.map((year) => ({ label: year.year, value: ratio(year.operatingIncome, year.revenue) }));
  const marginBars = [
    { label: 'Gross', value: stock.profitability.grossMargin },
    { label: 'Op.', value: stock.profitability.operatingMargin },
    { label: 'Net', value: stock.profitability.netMargin },
    { label: 'FCF', value: stock.cashFlow.fcfMargin },
  ];
  const sectorTags = [
    stock.sector,
    stock.industry,
    stock.marketCap === null ? null : marketCapBand(stock.marketCap),
    stock.valuation.fcfYield === null ? 'Cash Flow Review' : 'Free Cash Flow',
    stock.growth.revenueCagr3y === null ? 'Fundamental Data' : 'Growth Profile',
  ].filter(Boolean) as string[];
  const research = note.research;
  const scenarios = buildScenarios(stock, research);
  const targetLabel = formatPriceTarget(research, scenarios);
  const targetReturnLabel = formatTargetReturn(stock.price, research?.valuationModel?.basePriceTarget ?? null);

  return (
    <div className="analysis-detail-container edgequity-analysis-detail">
      <header className="analysis-detail-header">
        <div className="header-content">
          <h1 className="detail-title">Equity Research: {stock.name} ({stock.ticker})</h1>
          <p className="detail-meta">Initiated: May 2026 &nbsp;|&nbsp; Last Updated: {note.updatedAt} &nbsp;|&nbsp; Author: Edgequity AI</p>
        </div>
        <span className="back-button">Stock Analysis</span>
      </header>

      <article className="detail-content">
        <div className="stock-overview-card">
          <div className="stock-ticker-row">
            <div>
              <div className="stock-ticker">{stock.ticker}</div>
              <div className="stock-company-name">{stock.name} &nbsp;·&nbsp; {stock.sector ?? 'Sector unavailable'}</div>
            </div>
            <span className={`verdict-badge ${verdictClass(stock)}`}>{reportTone(stock)}</span>
          </div>
          <div className="info-tags">
            {sectorTags.map((tag) => <span className="info-tag" key={tag}>{tag}</span>)}
          </div>
          <p className="stock-thesis">"{note.quickTake} {note.bottomLine}"</p>
          <div className="quick-stats-grid">
            <QuickStat label="Entry Price" value={formatCurrencyWithCode(stock)} />
            <QuickStat label="3-Yr Price Target" value={targetLabel} />
            <QuickStat label="FCF Yield" value={formatEdgequityValue(stock.valuation.fcfYield, 'percent')} tone="positive" />
            <QuickStat label="Latest Revenue" value={formatEdgequityValue(latestYear?.revenue ?? null, 'money')} />
            <QuickStat label="Net Margin" value={formatEdgequityValue(stock.profitability.netMargin, 'percent')} />
            <QuickStat label="Free Cash Flow" value={formatEdgequityValue(latestYear?.freeCashFlow ?? null, 'money')} />
          </div>
        </div>

        <ReportSection number="02" title="Recent News & Earnings">
          <div className="update-timeline">
            <div className="update-card latest-update">
              <div className="update-card-header">
              <span className="update-card-title">{research?.earningsTitle ?? 'Latest Edgequity Research Update'}</span>
              <span className="update-date-pill">{research?.earningsDate ?? note.updatedAt}</span>
            </div>
            <div className="update-card-meta">
              <span>{formatEdgequityValue(stock.valuation.peTTM, 'multiple')} P/E TTM</span>
              <span>{formatEdgequityValue(stock.valuation.fcfYield, 'percent')} FCF yield</span>
            </div>
              {research ? (
                <>
                  {research.earningsTakeaways.map((takeaway) => <p key={takeaway}>{takeaway}</p>)}
                  <SubSection title="My read">
                    <p>{buildEarningsRead(stock, note)}</p>
                    <p>
                      This is the section I would update first after every earnings call because it tells us whether the
                      thesis is moving because of real operating evidence or because the multiple is simply expanding.
                    </p>
                  </SubSection>
                  <p className="text-xs text-[var(--vw-text-secondary)]">
                    Source: <a href={research.sourceUrl} target="_blank" rel="noreferrer">{research.sourceLabel}</a>
                  </p>
                </>
              ) : (
                <>
                  <p>{note.quickTake}</p>
                  <p>{note.valuationRead}</p>
                </>
              )}
              <div className="update-upside-row">
                <span className={`rating-pill ${ratingPillClass(stock)}`}>{reportTone(stock)}</span>
                <span className="upside-value neutral">{targetReturnLabel ?? 'Scenario model queued'}</span>
              </div>
            </div>
          </div>
        </ReportSection>

        <ReportSection number="03" title="Business Summary">
          {research ? (
            <>
              {research.businessSummary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <SubSection title="How the Business Makes Money">
                <p>
                  The simple way to read {stock.ticker} is through three lenses: the main product or platform that
                  drives revenue, the profit pool that carries margins, and the capital allocation pattern that decides
                  how much of that profit becomes shareholder value. Current financial statements show latest revenue of{' '}
                  {formatEdgequityValue(latestYear?.revenue ?? null, 'money')} and latest free cash flow of{' '}
                  {formatEdgequityValue(latestYear?.freeCashFlow ?? null, 'money')}.
                </p>
              </SubSection>
              <SubSection title="What Has To Go Right">
                <p>
                  {note.strengths[0]} {note.strengths[1]} The report should therefore focus less on whether this is a
                  recognizable franchise and more on whether the franchise can keep compounding without giving back too
                  much margin or paying too much for growth.
                </p>
              </SubSection>
              <SubSection title="What I Am Watching">
                <p>
                  {note.watchItems[0]} {note.watchItems[1]} These are not automatic thesis breakers, but they are the
                  areas where a good company can still become a bad stock if expectations get too aggressive.
                </p>
              </SubSection>
            </>
          ) : (
            <>
              <p>{stock.name} operates in {stock.industry ?? 'its reported industry'} within the {stock.sector ?? 'broader equity'} sector. This report uses the current Edgequity financial dataset to frame the business through valuation, profitability, growth, balance sheet strength, and cash conversion.</p>
              <SubSection title="Primary Business Engine">
                <p>{note.strengths[0]} The most important first-pass question is whether that advantage can keep translating into durable cash flow.</p>
              </SubSection>
              <SubSection title="Secondary Profit Pool">
                <p>{note.strengths[1]} This supports the broader thesis when revenue growth and margins move in the same direction.</p>
              </SubSection>
              <SubSection title="Pressure Point">
                <p>{note.watchItems[0]} This is the first item to monitor when reviewing new filings or earnings calls.</p>
              </SubSection>
              <SubSection title="Capital Allocation">
                <p>{note.watchItems[1]} Valuation discipline matters because the market can punish quality companies when expectations are too full.</p>
              </SubSection>
            </>
          )}
        </ReportSection>

        <ReportSection number="04" title="Core Segment Deep Dive">
          <h4>{research?.coreSegmentTitle ?? `${stock.industry ?? stock.sector ?? stock.ticker}: Operating Drivers`}</h4>
          {research ? (
            <>
              {research.coreSegmentBody.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <p>
                I want this section to do what the best reports in the `stocks` folder do: isolate the one segment that
                actually drives the stock. For {stock.ticker}, the core segment read is tied to revenue durability,
                operating margin, and whether management commentary from the latest call is showing acceleration,
                stabilization, or fatigue.
              </p>
            </>
          ) : (
            <p>The core segment work for {stock.ticker} should focus on revenue durability, margin direction, and free cash flow conversion. The current screen highlights {formatEdgequityValue(stock.growth.revenueCagr3y, 'percent')} three-year revenue CAGR and {formatEdgequityValue(stock.cashFlow.fcfMargin, 'percent')} FCF margin.</p>
          )}
          <div className="metric-pair-grid">
            <ReportKpi label="Revenue CAGR 3Y" value={formatEdgequityValue(stock.growth.revenueCagr3y, 'percent')} />
            <ReportKpi label="Operating Margin" value={formatEdgequityValue(stock.profitability.operatingMargin, 'percent')} />
            <ReportKpi label="ROIC" value={formatEdgequityValue(stock.profitability.roic, 'percent')} />
            <ReportKpi label="FCF Conversion" value={formatEdgequityValue(stock.cashFlow.fcfConversion, 'percent')} />
            <ReportKpi label="Current Ratio" value={formatEdgequityValue(stock.financialHealth.currentRatio, 'number')} />
            <ReportKpi label="Net Debt/EBITDA" value={formatEdgequityValue(stock.financialHealth.netDebtToEbitda, 'multiple')} />
          </div>
          <SubSection title="Revenue Trend">
            <MiniLineChart
              title="Revenue and Free Cash Flow"
              subtitle={`${historyPeriodLabel} Revenue and FCF`}
              primary={revenueSeries}
              secondary={fcfSeries}
              primaryLabel="Revenue"
              secondaryLabel="Free Cash Flow"
              yAxisLabel="USD in billions"
              xAxisLabel="Fiscal year"
              formatValue={formatChartMoney}
            />
            <p>
              The chart is intentionally simple. I am not trying to impress the reader with a complicated model here. I
              am trying to answer one question quickly: is revenue growth becoming more cash generative, or is the
              company spending heavily just to stand still?
            </p>
          </SubSection>
          <SubSection title="Margin Trend">
            <MiniLineChart
              title="Gross and Operating Margin"
              subtitle={`${historyPeriodLabel} Gross and Operating Margin`}
              primary={grossMarginSeries}
              secondary={operatingMarginSeries}
              primaryLabel="Gross Margin"
              secondaryLabel="Operating Margin"
              yAxisLabel="Margin percentage"
              xAxisLabel="Fiscal year"
              formatValue={(value) => formatEdgequityValue(value, 'percent')}
            />
            <p>
              I chart gross margin and operating margin over the same five periods because this shows whether revenue
              growth is translating into better economics. Gross margin captures product and infrastructure cost, while
              operating margin captures scale after R&amp;D, sales, and administrative spending.
            </p>
          </SubSection>
          <SubSection title="Current Margin Stack">
            <MarginBars bars={marginBars} />
            <p>
              The margin stack is where the quality of the business shows up. Gross margin tells us whether the company
              has pricing power, operating margin tells us how much scale converts to profit, and FCF margin tells us
              whether those accounting profits are turning into usable cash.
            </p>
          </SubSection>
        </ReportSection>

        <ReportSection number="05" title="Industry Context">
          {research ? (
            <>
              {research.industryContext.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <SubSection title="Why This Matters">
                <p>
                  The industry backdrop matters because valuation is never judged in isolation. A high multiple can be
                  rational when the market is expanding and the company is gaining share, but the same multiple becomes
                  dangerous when growth slows or the competitive set catches up. That is why I compare the story from
                  the transcript against the hard financials instead of relying on narrative alone.
                </p>
              </SubSection>
            </>
          ) : (
            <>
              <p>{stock.ticker} competes in {stock.industry ?? 'a sector'} where investor attention usually centers on growth durability, pricing power, and capital intensity. The useful comparison set should include direct peers with similar margin structure and reinvestment needs.</p>
              <p>For this project, the industry view should remain simple: is the company gaining share, defending margins, and converting growth into cash faster than peers?</p>
            </>
          )}
        </ReportSection>

        <ReportSection number="06" title="Competitive Advantages & Moat">
          <p>
            A moat section should be more than a list of nice qualities. The question is whether the advantage shows up
            in financial output. For {stock.ticker}, the current dataset shows gross margin of{' '}
            {formatEdgequityValue(stock.profitability.grossMargin, 'percent')}, operating margin of{' '}
            {formatEdgequityValue(stock.profitability.operatingMargin, 'percent')}, and ROIC of{' '}
            {formatEdgequityValue(stock.profitability.roic, 'percent')}.
          </p>
          <NumberedPoints items={
            research
              ? research.moatPoints.map((point) => [point.title, point.body])
              : [
                  ['Business Quality', note.strengths[0]],
                  ['Cash Generation', note.strengths[1]],
                  ['Margin Structure', `Gross margin is ${formatEdgequityValue(stock.profitability.grossMargin, 'percent')} and operating margin is ${formatEdgequityValue(stock.profitability.operatingMargin, 'percent')}.`],
                  ['Balance Sheet Flexibility', `Debt/equity is ${formatEdgequityValue(stock.financialHealth.debtToEquity, 'number')} and current ratio is ${formatEdgequityValue(stock.financialHealth.currentRatio, 'number')}.`],
                  ['Valuation Discipline', note.valuationRead],
                ]
          } />
        </ReportSection>

        <ReportSection number="07" title="Revenue Growth & Profitability">
          <p>
            This is the financial proof section. The narrative from earnings only matters if it appears in revenue,
            margins, net income, and free cash flow. I use this table to see whether management is describing a real
            compounding engine or just a temporary cycle.
          </p>
          <div className="metric-pair-grid">
            <ReportKpi label="Latest Revenue" value={formatEdgequityValue(latestYear?.revenue ?? null, 'money')} sublabel={latestYear?.year} />
            <ReportKpi label="Gross Margin" value={formatEdgequityValue(stock.profitability.grossMargin, 'percent')} />
            <ReportKpi label="Operating Margin" value={formatEdgequityValue(stock.profitability.operatingMargin, 'percent')} />
            <ReportKpi label="Free Cash Flow" value={formatEdgequityValue(stock.cashFlow.freeCashFlow, 'money')} />
            <ReportKpi label="FCF Margin" value={formatEdgequityValue(stock.cashFlow.fcfMargin, 'percent')} />
            <ReportKpi label="ROE" value={formatEdgequityValue(stock.profitability.roe, 'percent')} />
          </div>
          <ReportHistoryTable stock={stock} />
          <p>
            The most useful comparison is not just year-over-year growth. It is the relationship between revenue growth
            and free cash flow. If revenue rises while FCF conversion weakens, the company may be buying growth. If both
            rise together, the thesis becomes much cleaner.
          </p>
        </ReportSection>

        <ReportSection number="08" title="Earnings Per Share">
          <div className="metric-pair-grid">
            <ReportKpi label="P/E TTM" value={formatEdgequityValue(stock.valuation.peTTM, 'multiple')} />
            <ReportKpi label="Forward P/E" value={formatEdgequityValue(stock.valuation.forwardPE, 'multiple')} />
            <ReportKpi label="Earnings Yield" value={formatEdgequityValue(stock.valuation.earningsYield, 'percent')} />
          </div>
          <p>
            EPS is where operating performance meets share count. A company can grow net income and still disappoint
            shareholders if dilution is heavy or if investors were already paying for perfection. For this first pass,
            Edgequity uses available valuation multiples and financial statements; the next upgrade should connect
            consensus EPS estimates so this section can separate GAAP, adjusted EPS, and forecast EPS the way the
            Tonivest standalone reports do.
          </p>
          <p>
            The current read is that earnings quality should be judged beside free cash flow. EPS can be smoothed by
            accounting, but free cash flow tells us whether the company has real capacity for buybacks, dividends,
            debt reduction, or reinvestment.
          </p>
        </ReportSection>

        <ReportSection number="09" title="Balance Sheet">
          <div className="metric-pair-grid">
            <ReportKpi label="Market Cap" value={formatEdgequityValue(stock.marketCap, 'money')} />
            <ReportKpi label="Enterprise Value" value={formatEdgequityValue(stock.enterpriseValue, 'money')} />
            <ReportKpi label="Total Debt" value={formatEdgequityValue(latestYear?.totalDebt ?? null, 'money')} />
            <ReportKpi label="Equity" value={formatEdgequityValue(latestYear?.totalEquity ?? null, 'money')} />
            <ReportKpi label="Current Ratio" value={formatEdgequityValue(stock.financialHealth.currentRatio, 'number')} />
            <ReportKpi label="Debt/Equity" value={formatEdgequityValue(stock.financialHealth.debtToEquity, 'number')} />
          </div>
          <p>The balance-sheet read should focus on whether leverage limits reinvestment flexibility. Current Edgequity data flags {formatEdgequityValue(stock.financialHealth.netDebtToEbitda, 'multiple')} net debt to EBITDA.</p>
          <p>
            I care about the balance sheet because it decides how much room management has when the cycle turns. A strong
            balance sheet lets a company keep investing while weaker competitors pull back. A stretched balance sheet
            makes even a good operating business more fragile.
          </p>
        </ReportSection>

        <ReportSection number="10" title="3-Year Forecast">
          <h4>3-Year Forecast & Scenario Analysis</h4>
          <p>{research?.forecastSummary ?? 'The forecast view is directional. It translates the current screen into bear, base, and bull cases so the user can quickly see what would need to go right or wrong.'}</p>
          <p>
            I keep the forecast scenario-driven because precision would be fake. The goal is to show the shape of the
            bet: what has to go wrong for the bear case, what has to keep working for the base case, and what kind of
            operating surprise would justify the bull case.
          </p>
          <div className="scenario-comparison-grid">
            {scenarios.map((scenario) => (
              <article key={scenario.label} className={`scenario-col ${scenario.kind}`}>
                <div className="scenario-col-label">{scenario.label}</div>
                <div className="scenario-col-pt">{scenario.target}</div>
                <div className="scenario-col-upside">{scenario.returnText}</div>
                <div className="scenario-col-rows">
                  <ScenarioRow label="3yr Rev CAGR" value={scenario.revenueCagr} />
                  <ScenarioRow label="Margin" value={scenario.margin} />
                  <ScenarioRow label="Trigger" value={scenario.trigger} />
                </div>
              </article>
            ))}
          </div>
          <p>
            The base case is not a promise. It is the set of assumptions I would revisit after each earnings call. If
            the transcript starts contradicting the base-case trigger, the rating should change before the numbers fully
            show up in annual statements.
          </p>
        </ReportSection>

        <ReportSection number="11" title="Valuation">
          <p>{research?.valuationNarrative ?? note.valuationRead}</p>
          <p>
            I look at valuation in two layers. The first layer is today’s multiple: what the market is asking us to pay
            for the current business. The second layer is the earnings bridge: whether the next three years of growth
            can make that multiple look reasonable without assuming heroic terminal value.
          </p>
          <div className="metric-pair-grid">
            <ReportKpi label="Entry Price" value={formatCurrencyWithCode(stock)} />
            <ReportKpi label="3-Yr Price Target" value={targetLabel} />
            <ReportKpi label="P/E TTM" value={formatEdgequityValue(stock.valuation.peTTM, 'multiple')} />
            <ReportKpi label="Forward P/E" value={formatEdgequityValue(stock.valuation.forwardPE, 'multiple')} />
            <ReportKpi label="P/S" value={formatEdgequityValue(stock.valuation.psTTM, 'multiple')} />
            <ReportKpi label="EV / EBITDA" value={formatEdgequityValue(stock.valuation.evEbitda, 'multiple')} />
            <ReportKpi label="FCF Yield" value={formatEdgequityValue(stock.valuation.fcfYield, 'percent')} />
          </div>
          {research?.valuationModel && (
            <SubSection title="Price Target Method">
              <p>{research.valuationModel.method}</p>
              <ul className="eq-report-bullets">
                {research.valuationModel.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
              </ul>
            </SubSection>
          )}
          <p>
            A low FCF yield is not automatically bad for a high-growth company, but it means the burden of proof is
            higher. A high FCF yield is not automatically cheap if the business is declining. This is why the valuation
            section has to be read together with the industry and moat sections.
          </p>
        </ReportSection>

        <ReportSection number="12" title="Sensitivity Analysis">
          <SensitivityGrid stock={stock} />
          <p>
            The highlighted base cell is a directional anchor, not a recommendation. It helps show how sensitive the
            thesis is to growth and discount-rate assumptions. This is especially important for premium compounders
            because a small change in terminal assumptions can move the implied value much more than a single quarter of
            earnings.
          </p>
          <p>
            The point of this table is humility. If the stock only works in the most optimistic cells, the margin of
            safety is thin. If the stock still looks reasonable across a wide range of assumptions, the setup is much
            stronger.
          </p>
        </ReportSection>

        <ReportSection number="13" title="Key Risks">
          <p>
            These are the risks I would monitor after every transcript, filing, and guidance update. The goal is not to
            list every possible problem. The goal is to identify the risks that would actually change the thesis.
          </p>
          <NumberedPoints items={
            research
              ? research.riskPoints.map((risk) => [risk.title, risk.body])
              : [
                  ['Execution Risk', note.watchItems[0]],
                  ['Valuation Risk', note.watchItems[1]],
                  ['Margin Risk', `Margin disappointment would matter because current operating margin is ${formatEdgequityValue(stock.profitability.operatingMargin, 'percent')}.`],
                  ['Balance Sheet Risk', `Higher leverage or weaker liquidity would reduce flexibility; current ratio is ${formatEdgequityValue(stock.financialHealth.currentRatio, 'number')}.`],
                  ['Cash Flow Risk', `FCF conversion needs monitoring because current FCF conversion is ${formatEdgequityValue(stock.cashFlow.fcfConversion, 'percent')}.`],
                  ['Data Refresh Risk', 'This report uses the current static Edgequity dataset and should be refreshed after new filings, earnings, or guidance updates.'],
                ]
          } />
        </ReportSection>

        <ReportSection number="14" title="Final Verdict">
          <div className="final-verdict-box">
            <div className="fvb-inner">
              <div>
                <span className="fvb-rating-label">Current Rating</span>
                <span className="fvb-rating">{reportTone(stock)}</span>
              </div>
              <div className="fvb-stats-row">
                <FinalVerdictStat label="Entry Price" value={formatCurrencyWithCode(stock)} />
                <FinalVerdictStat label="3-Yr Price Target" value={targetLabel} />
                <FinalVerdictStat label="FCF Yield" value={formatEdgequityValue(stock.valuation.fcfYield, 'percent')} tone="positive" />
                <FinalVerdictStat label="Base Case" value={scenarios[1].target} />
                <FinalVerdictStat label="Bear Case" value={scenarios[0].target} tone="negative" />
              </div>
            </div>
            <p className="fvb-reasoning">{research?.finalVerdict ?? note.bottomLine}</p>
            <p className="fvb-reasoning">
              My preferred way to use this report is as a living thesis page. When the next earnings call comes out, the
              first update should be the Recent News section, then the segment deep dive, then the valuation assumptions.
              That keeps the report close to the evidence instead of becoming a static opinion.
            </p>
          </div>
        </ReportSection>
      </article>
    </div>
  );
}

function EquityResearchReport({ stock, note }: { stock: EdgequityStockRecord; note: EdgequityAnalysisNote }) {
  const sectorTags = [
    stock.sector,
    stock.industry,
    stock.marketCap === null ? null : marketCapBand(stock.marketCap),
    stock.valuation.fcfYield === null ? 'Cash Flow Review' : 'Free Cash Flow',
    stock.growth.revenueCagr3y === null ? 'Fundamental Data' : 'Growth Profile',
  ].filter(Boolean) as string[];

  const latestYear = stock.history[0];
  const fiveYearHistory = getFiveYearHistory(stock);
  const historyPeriodLabel = getHistoryPeriodLabel(fiveYearHistory);
  const revenueSeries = fiveYearHistory.map((year) => ({ label: year.year, value: year.revenue }));
  const fcfSeries = fiveYearHistory.map((year) => ({ label: year.year, value: year.freeCashFlow }));
  const grossMarginSeries = fiveYearHistory.map((year) => ({ label: year.year, value: ratio(year.grossProfit, year.revenue) }));
  const operatingMarginSeries = fiveYearHistory.map((year) => ({ label: year.year, value: ratio(year.operatingIncome, year.revenue) }));
  const marginBars = [
    { label: 'Gross', value: stock.profitability.grossMargin },
    { label: 'Op.', value: stock.profitability.operatingMargin },
    { label: 'Net', value: stock.profitability.netMargin },
    { label: 'FCF', value: stock.cashFlow.fcfMargin },
  ];
  const scenarios = buildScenarios(stock, note.research);
  const targetLabel = formatPriceTarget(note.research, scenarios);

  return (
    <article className="eq-research-report">
      <header className="eq-report-cover">
        <div>
          <p className="eq-report-eyebrow">Equity Research: {stock.name} ({stock.ticker})</p>
          <p className="eq-report-meta">Initiated: May 2026 | Last Updated: {note.updatedAt} | Author: Edgequity AI</p>
        </div>
        <div className="eq-report-identity">
          <div>
            <p className="eq-report-ticker">{stock.ticker}</p>
            <h3>{stock.name} <span>· {stock.sector ?? 'Sector unavailable'}</span></h3>
          </div>
          <strong className="eq-report-rating">{reportTone(stock)}</strong>
        </div>
        <div className="eq-report-tags">
          {sectorTags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <blockquote>{note.quickTake} {note.bottomLine}</blockquote>
        <div className="eq-report-kpis">
          <ReportKpi label="Entry Price" sublabel="Latest static data" value={formatCurrencyWithCode(stock)} />
          <ReportKpi label="3-Yr Price Target" sublabel="Scenario model" value={targetLabel} />
          <ReportKpi label="FCF Yield" sublabel="Current screen" value={formatEdgequityValue(stock.valuation.fcfYield, 'percent')} />
          <ReportKpi label="Latest Revenue" sublabel={latestYear?.year ?? 'History pending'} value={formatEdgequityValue(latestYear?.revenue ?? null, 'money')} />
          <ReportKpi label="Net Margin" sublabel="TTM / annual metric" value={formatEdgequityValue(stock.profitability.netMargin, 'percent')} />
          <ReportKpi label="Free Cash Flow" sublabel={latestYear?.year ?? 'History pending'} value={formatEdgequityValue(latestYear?.freeCashFlow ?? null, 'money')} />
        </div>
      </header>

      <ReportSection number="02" title="Recent News & Earnings">
        <h4>Latest Edgequity Research Update</h4>
        <p>{note.quickTake}</p>
        <div className="eq-report-callout">
          <span>{reportTone(stock)}</span>
          <strong>{note.valuationRead}</strong>
        </div>
      </ReportSection>

      <ReportSection number="03" title="Business Summary">
        <p>{stock.name} operates in {stock.industry ?? 'its reported industry'} within the {stock.sector ?? 'broader equity'} sector. This report uses the current Edgequity financial dataset to frame the business through valuation, profitability, growth, balance sheet strength, and cash conversion.</p>
        <SubSection title="Primary Business Engine">
          <p>{note.strengths[0]} The most important first-pass question is whether that advantage can keep translating into durable cash flow.</p>
        </SubSection>
        <SubSection title="Secondary Profit Pool">
          <p>{note.strengths[1]} This supports the broader thesis when revenue growth and margins move in the same direction.</p>
        </SubSection>
        <SubSection title="Pressure Point">
          <p>{note.watchItems[0]} This is the first item to monitor when reviewing new filings or earnings calls.</p>
        </SubSection>
        <SubSection title="Capital Allocation">
          <p>{note.watchItems[1]} Valuation discipline matters because the market can punish quality companies when expectations are too full.</p>
        </SubSection>
      </ReportSection>

      <ReportSection number="04" title="Core Segment Deep Dive">
        <h4>{stock.industry ?? stock.sector ?? stock.ticker}: Operating Drivers</h4>
        <p>The core segment work for {stock.ticker} should focus on revenue durability, margin direction, and free cash flow conversion. The current screen highlights {formatEdgequityValue(stock.growth.revenueCagr3y, 'percent')} three-year revenue CAGR and {formatEdgequityValue(stock.cashFlow.fcfMargin, 'percent')} FCF margin.</p>
        <div className="eq-report-metric-grid">
          <ReportKpi label="Revenue CAGR 3Y" value={formatEdgequityValue(stock.growth.revenueCagr3y, 'percent')} />
          <ReportKpi label="Operating Margin" value={formatEdgequityValue(stock.profitability.operatingMargin, 'percent')} />
          <ReportKpi label="ROIC" value={formatEdgequityValue(stock.profitability.roic, 'percent')} />
          <ReportKpi label="FCF Conversion" value={formatEdgequityValue(stock.cashFlow.fcfConversion, 'percent')} />
          <ReportKpi label="Current Ratio" value={formatEdgequityValue(stock.financialHealth.currentRatio, 'number')} />
          <ReportKpi label="Net Debt/EBITDA" value={formatEdgequityValue(stock.financialHealth.netDebtToEbitda, 'multiple')} />
        </div>
        <SubSection title="Revenue Trend">
          <MiniLineChart
            title="Revenue and Free Cash Flow"
            subtitle={`${historyPeriodLabel} Revenue and FCF`}
            primary={revenueSeries}
            secondary={fcfSeries}
            primaryLabel="Revenue"
            secondaryLabel="Free Cash Flow"
            yAxisLabel="USD in billions"
            xAxisLabel="Fiscal year"
            formatValue={formatChartMoney}
          />
        </SubSection>
        <SubSection title="Margin Trend">
          <MiniLineChart
            title="Gross and Operating Margin"
            subtitle={`${historyPeriodLabel} Gross and Operating Margin`}
            primary={grossMarginSeries}
            secondary={operatingMarginSeries}
            primaryLabel="Gross Margin"
            secondaryLabel="Operating Margin"
            yAxisLabel="Margin percentage"
            xAxisLabel="Fiscal year"
            formatValue={(value) => formatEdgequityValue(value, 'percent')}
          />
        </SubSection>
        <SubSection title="Margin Profile">
          <MarginBars bars={marginBars} />
        </SubSection>
      </ReportSection>

      <ReportSection number="05" title="Industry Context">
        <p>{stock.ticker} competes in {stock.industry ?? 'a sector'} where investor attention usually centers on growth durability, pricing power, and capital intensity. The useful comparison set should include direct peers with similar margin structure and reinvestment needs.</p>
        <p>For this project, the industry view should remain simple: is the company gaining share, defending margins, and converting growth into cash faster than peers?</p>
      </ReportSection>

      <ReportSection number="06" title="Competitive Advantages & Moat">
        <NumberedPoints items={[
          ['Business Quality', note.strengths[0]],
          ['Cash Generation', note.strengths[1]],
          ['Margin Structure', `Gross margin is ${formatEdgequityValue(stock.profitability.grossMargin, 'percent')} and operating margin is ${formatEdgequityValue(stock.profitability.operatingMargin, 'percent')}.`],
          ['Balance Sheet Flexibility', `Debt/equity is ${formatEdgequityValue(stock.financialHealth.debtToEquity, 'number')} and current ratio is ${formatEdgequityValue(stock.financialHealth.currentRatio, 'number')}.`],
          ['Valuation Discipline', note.valuationRead],
        ]} />
      </ReportSection>

      <ReportSection number="07" title="Revenue Growth & Profitability">
        <div className="eq-report-metric-grid">
          <ReportKpi label="Latest Revenue" value={formatEdgequityValue(latestYear?.revenue ?? null, 'money')} sublabel={latestYear?.year} />
          <ReportKpi label="Gross Margin" value={formatEdgequityValue(stock.profitability.grossMargin, 'percent')} />
          <ReportKpi label="Operating Margin" value={formatEdgequityValue(stock.profitability.operatingMargin, 'percent')} />
          <ReportKpi label="Free Cash Flow" value={formatEdgequityValue(stock.cashFlow.freeCashFlow, 'money')} />
          <ReportKpi label="FCF Margin" value={formatEdgequityValue(stock.cashFlow.fcfMargin, 'percent')} />
          <ReportKpi label="ROE" value={formatEdgequityValue(stock.profitability.roe, 'percent')} />
        </div>
        <ReportHistoryTable stock={stock} />
      </ReportSection>

      <ReportSection number="08" title="Earnings Per Share">
        <div className="eq-report-metric-grid">
          <ReportKpi label="P/E TTM" value={formatEdgequityValue(stock.valuation.peTTM, 'multiple')} />
          <ReportKpi label="Forward P/E" value={formatEdgequityValue(stock.valuation.forwardPE, 'multiple')} />
          <ReportKpi label="Earnings Yield" value={formatEdgequityValue(stock.valuation.earningsYield, 'percent')} />
        </div>
        <p>EPS detail is summarized through available valuation multiples. A future research refresh can add GAAP and adjusted EPS history once estimates are connected to the Edgequity data pipeline.</p>
      </ReportSection>

      <ReportSection number="09" title="Balance Sheet">
        <div className="eq-report-metric-grid">
          <ReportKpi label="Market Cap" value={formatEdgequityValue(stock.marketCap, 'money')} />
          <ReportKpi label="Enterprise Value" value={formatEdgequityValue(stock.enterpriseValue, 'money')} />
          <ReportKpi label="Total Debt" value={formatEdgequityValue(latestYear?.totalDebt ?? null, 'money')} />
          <ReportKpi label="Equity" value={formatEdgequityValue(latestYear?.totalEquity ?? null, 'money')} />
          <ReportKpi label="Current Ratio" value={formatEdgequityValue(stock.financialHealth.currentRatio, 'number')} />
          <ReportKpi label="Debt/Equity" value={formatEdgequityValue(stock.financialHealth.debtToEquity, 'number')} />
        </div>
        <p>The balance-sheet read should focus on whether leverage limits reinvestment flexibility. Current Edgequity data flags {formatEdgequityValue(stock.financialHealth.netDebtToEbitda, 'multiple')} net debt to EBITDA.</p>
      </ReportSection>

      <ReportSection number="10" title="3-Year Forecast">
        <h4>3-Year Forecast & Scenario Analysis</h4>
        <p>The forecast view is directional. It translates the current screen into bear, base, and bull cases so the user can quickly see what would need to go right or wrong.</p>
        <div className="eq-scenario-grid">
          {scenarios.map((scenario) => (
            <article key={scenario.label} className="eq-scenario-card">
              <h5>{scenario.label}</h5>
              <strong>{scenario.target}</strong>
              <p>{scenario.returnText}</p>
              <dl>
                <div><dt>Revenue CAGR</dt><dd>{scenario.revenueCagr}</dd></div>
                <div><dt>Margin</dt><dd>{scenario.margin}</dd></div>
                <div><dt>Trigger</dt><dd>{scenario.trigger}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </ReportSection>

      <ReportSection number="11" title="Valuation">
        <p>{note.valuationRead}</p>
        <div className="eq-report-metric-grid">
          <ReportKpi label="Entry Price" value={formatCurrencyWithCode(stock)} />
          <ReportKpi label="P/E TTM" value={formatEdgequityValue(stock.valuation.peTTM, 'multiple')} />
          <ReportKpi label="Forward P/E" value={formatEdgequityValue(stock.valuation.forwardPE, 'multiple')} />
          <ReportKpi label="P/S" value={formatEdgequityValue(stock.valuation.psTTM, 'multiple')} />
          <ReportKpi label="EV / EBITDA" value={formatEdgequityValue(stock.valuation.evEbitda, 'multiple')} />
          <ReportKpi label="FCF Yield" value={formatEdgequityValue(stock.valuation.fcfYield, 'percent')} />
        </div>
      </ReportSection>

      <ReportSection number="12" title="Sensitivity Analysis">
        <SensitivityGrid stock={stock} />
        <p>The highlighted base cell is a directional anchor, not a recommendation. It helps show how sensitive the thesis is to growth and discount-rate assumptions.</p>
      </ReportSection>

      <ReportSection number="13" title="Key Risks">
        <NumberedPoints items={[
          ['Execution Risk', note.watchItems[0]],
          ['Valuation Risk', note.watchItems[1]],
          ['Margin Risk', `Margin disappointment would matter because current operating margin is ${formatEdgequityValue(stock.profitability.operatingMargin, 'percent')}.`],
          ['Balance Sheet Risk', `Higher leverage or weaker liquidity would reduce flexibility; current ratio is ${formatEdgequityValue(stock.financialHealth.currentRatio, 'number')}.`],
          ['Cash Flow Risk', `FCF conversion needs monitoring because current FCF conversion is ${formatEdgequityValue(stock.cashFlow.fcfConversion, 'percent')}.`],
          ['Data Refresh Risk', 'This report uses the current static Edgequity dataset and should be refreshed after new filings, earnings, or guidance updates.'],
        ]} />
      </ReportSection>

      <ReportSection number="14" title="Final Verdict">
        <div className="eq-report-metric-grid">
          <ReportKpi label="Current Rating" value={reportTone(stock)} />
          <ReportKpi label="Entry Price" value={formatCurrencyWithCode(stock)} />
          <ReportKpi label="3-Yr Price Target" value={targetLabel} />
          <ReportKpi label="FCF Yield" value={formatEdgequityValue(stock.valuation.fcfYield, 'percent')} />
          <ReportKpi label="Base Case" value={scenarios[1].target} />
          <ReportKpi label="Bear Case" value={scenarios[0].target} />
        </div>
        <p>{note.bottomLine}</p>
      </ReportSection>
    </article>
  );
}

function ReportSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="detail-section">
      <p className="eq-report-section-number">{number} — {title}</p>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function ReportKpi({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="metric-pair">
      <div className="mp-label">{label}</div>
      <div className="mp-value">{value}</div>
      {sublabel && <div className="mp-context">{sublabel}</div>}
    </div>
  );
}

function QuickStat({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' | 'neutral' }) {
  return (
    <div className="quick-stat">
      <span className={`quick-stat-value ${tone ? `qs-${tone}` : ''}`}>{value}</span>
      <span className="quick-stat-label">{label}</span>
    </div>
  );
}

function ScenarioRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="scenario-col-row">
      <span className="scenario-col-row-label">{label}</span>
      <span className="scenario-col-row-val">{value}</span>
    </div>
  );
}

function FinalVerdictStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <div>
      <span className="fvb-stat-label">{label}</span>
      <span className={`fvb-stat-value ${tone ? `fvb-${tone}` : ''}`}>{value}</span>
    </div>
  );
}

function NumberedPoints({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="eq-numbered-points">
      {items.map(([title, body], index) => (
        <section key={title}>
          <h4>{index + 1}. {title}</h4>
          <p>{body}</p>
        </section>
      ))}
    </div>
  );
}

function getFiveYearHistory(stock: EdgequityStockRecord) {
  return stock.history
    .slice(0, 5)
    .slice()
    .reverse();
}

function getHistoryPeriodLabel(history: EdgequityStockRecord['history']) {
  return history.some((year) => /(^|[-\s])Q[1-4]\b/i.test(year.year) || /\bQ[1-4]\s+\d{4}/i.test(year.year))
    ? '5Q'
    : '5Y';
}

function ratio(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

function formatChartMoney(value: number) {
  return Math.abs(value) >= 1_000_000
    ? `$${(value / 1_000_000_000).toFixed(1)}B`
    : `$${value.toFixed(1)}`;
}

function MiniLineChart({
  title,
  subtitle,
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  yAxisLabel,
  xAxisLabel,
  formatValue,
}: {
  title: string;
  subtitle: string;
  primary: Array<{ label: string; value: number | null }>;
  secondary: Array<{ label: string; value: number | null }>;
  primaryLabel: string;
  secondaryLabel: string;
  yAxisLabel: string;
  xAxisLabel: string;
  formatValue: (value: number) => string;
}) {
  const values = [...primary, ...secondary].map((point) => point.value).filter((value): value is number => value !== null);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const plot = {
    left: 48,
    right: 264,
    top: 20,
    mid: 62,
    bottom: 104,
  };
  const toPoint = (point: { label: string; value: number | null }, index: number, seriesLength: number) => {
    if (point.value === null) return null;

    const x = seriesLength <= 1 ? plot.left : plot.left + (index / (seriesLength - 1)) * (plot.right - plot.left);
    const y = plot.bottom - ((point.value - min) / range) * (plot.bottom - plot.top);
    return { x, y, label: point.label, value: point.value };
  };
  const primaryPoints = primary
    .map((point, index) => toPoint(point, index, primary.length))
    .filter((point): point is { x: number; y: number; label: string; value: number } => point !== null);
  const secondaryPoints = secondary
    .map((point, index) => toPoint(point, index, secondary.length))
    .filter((point): point is { x: number; y: number; label: string; value: number } => point !== null);
  const primaryLine = primaryPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const secondaryLine = secondaryPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const yMaxLabel = formatValue(max);
  const yMidLabel = formatValue(min + range / 2);
  const yMinLabel = formatValue(min);
  const primaryEnd = primaryPoints.at(-1);
  const secondaryEnd = secondaryPoints.at(-1);
  const dataRows = primary.map((point, index) => ({
    label: point.label,
    primaryValue: point.value,
    secondaryValue: secondary[index]?.value ?? null,
  }));

  return (
    <div className="eq-report-chart">
      <div className="eq-report-chart-head">
        <h5>{title}</h5>
        <span>{subtitle}</span>
      </div>
      <div className="eq-chart-axis-strip">
        <span>Y-axis: {yAxisLabel}</span>
        <span>X-axis: {xAxisLabel}</span>
      </div>
      <div className="eq-chart-legend" aria-label={`${title} legend`}>
        <span><i className="eq-chart-swatch-primary" />{primaryLabel}</span>
        <span><i className="eq-chart-swatch-secondary" />{secondaryLabel}</span>
      </div>
      <div className="eq-chart-latest-row">
        <span>
          <b>{primaryLabel}</b>
          {primaryEnd ? `Latest: ${formatValue(primaryEnd.value)}` : 'Latest: -'}
        </span>
        <span>
          <b>{secondaryLabel}</b>
          {secondaryEnd ? `Latest: ${formatValue(secondaryEnd.value)}` : 'Latest: -'}
        </span>
      </div>
      <svg viewBox="0 0 320 146" role="img" aria-label={`${title} chart. Y-axis: ${yAxisLabel}. X-axis: ${xAxisLabel}.`}>
        <text className="eq-chart-axis-value" x="38" y={plot.top + 3} textAnchor="end">{yMaxLabel}</text>
        <text className="eq-chart-axis-value" x="38" y={plot.mid + 3} textAnchor="end">{yMidLabel}</text>
        <text className="eq-chart-axis-value" x="38" y={plot.bottom + 3} textAnchor="end">{yMinLabel}</text>
        <line className="eq-chart-gridline" x1={plot.left} y1={plot.top} x2={plot.right} y2={plot.top} />
        <line className="eq-chart-gridline" x1={plot.left} y1={plot.mid} x2={plot.right} y2={plot.mid} />
        <line x1={plot.left} y1={plot.bottom} x2={plot.right} y2={plot.bottom} />
        <line x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.bottom} />
        {primaryLine && <polyline className="eq-chart-line-primary" points={primaryLine} />}
        {secondaryLine && <polyline className="eq-chart-line-secondary" points={secondaryLine} />}
        {primaryPoints.map((point) => (
          <circle className="eq-chart-point-primary" key={`primary-${point.label}`} cx={point.x} cy={point.y} r="3.5" />
        ))}
        {secondaryPoints.map((point) => (
          <circle className="eq-chart-point-secondary" key={`secondary-${point.label}`} cx={point.x} cy={point.y} r="3.5" />
        ))}
        {primaryPoints.map((point) => (
          <text className="eq-chart-x-tick" key={`x-${point.label}`} x={point.x} y="128" textAnchor="middle">{point.label}</text>
        ))}
      </svg>
      <table className="eq-chart-data-table" aria-label={`${title} data labels`}>
        <thead>
          <tr>
            <th>{xAxisLabel}</th>
            <th>{primaryLabel}</th>
            <th>{secondaryLabel}</th>
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.primaryValue === null ? '-' : formatValue(row.primaryValue)}</td>
              <td>{row.secondaryValue === null ? '-' : formatValue(row.secondaryValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarginBars({ bars }: { bars: Array<{ label: string; value: number | null }> }) {
  return (
    <div className="eq-report-chart">
      <div className="eq-report-chart-head">
        <h5>Margin Stack</h5>
        <span>Current screen</span>
      </div>
      <div className="eq-margin-bars">
        {bars.map((bar) => {
          const width = `${Math.max(0, Math.min(100, (bar.value ?? 0) * 100))}%`;
          return (
            <div key={bar.label}>
              <span>{bar.label}</span>
              <div><i style={{ width }} /></div>
              <strong>{formatEdgequityValue(bar.value, 'percent')}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportHistoryTable({ stock }: { stock: EdgequityStockRecord }) {
  return (
    <div className="eq-report-table-wrap">
      <h4>Historical Income Statement ($)</h4>
      <table className="forecast-table">
        <thead>
          <tr>
            <th>Metric</th>
            {stock.history.map((year) => <th key={year.year}>{year.year}</th>)}
          </tr>
        </thead>
        <tbody>
          {REPORT_HISTORY_FIELDS.map((field) => (
            <tr key={field.id}>
              <th>{field.label}</th>
              {stock.history.map((year) => (
                <td key={`${year.year}-${field.id}`}>{formatEdgequityValue(year[field.id as ReportHistoryField], 'money')}</td>
              ))}
            </tr>
          ))}
          {stock.history.length === 0 && (
            <tr>
              <td colSpan={2}>Historical fundamentals are queued for the next data refresh.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SensitivityGrid({ stock }: { stock: EdgequityStockRecord }) {
  const price = stock.price ?? 100;
  const growthCases = [0.9, 1, 1.1];
  const rateCases = [0.95, 1, 1.05];

  return (
    <div className="sensitivity-wrap eq-sensitivity-grid">
      <table className="sensitivity-table">
        <thead>
          <tr>
            <th className="st-corner">Growth \ Discount</th>
            <th>Lower</th>
            <th>Base</th>
            <th>Higher</th>
          </tr>
        </thead>
        <tbody>
          {growthCases.map((growth, rowIndex) => (
            <tr key={growth}>
              <td className="st-row-head">{rowIndex === 0 ? 'Bear' : rowIndex === 1 ? 'Base' : 'Bull'}</td>
              {rateCases.map((rate, columnIndex) => {
                const value = price * growth / rate;
                const isBase = rowIndex === 1 && columnIndex === 1;
                return <td key={rate} className={isBase ? 'st-highlight is-base' : ''}>{formatEdgequityValue(value, 'money')}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildScenarios(stock: EdgequityStockRecord, research?: EdgequityResearchReportNote) {
  const price = stock.price;
  const valuationModel = research?.valuationModel;
  const formatTarget = (multiple: number, modeledTarget?: number) => (
    modeledTarget !== undefined
      ? formatEdgequityValue(modeledTarget, 'money')
      : price === null ? 'TBD' : formatEdgequityValue(price * multiple, 'money')
  );
  const formatReturn = (modeledTarget: number | undefined, fallback: string) => {
    if (price === null) return fallback;
    if (modeledTarget === undefined) return fallback;

    return `${formatSignedPercent((modeledTarget / price) - 1)} vs entry`;
  };

  return [
    {
      label: 'Bear Case',
      kind: 'bear',
      target: formatTarget(0.85, valuationModel?.bearPriceTarget),
      returnText: formatReturn(valuationModel?.bearPriceTarget, price === null ? 'Downside case pending price data' : '-15% downside framework'),
      revenueCagr: formatEdgequityValue((stock.growth.revenueCagr3y ?? 0.02) * 0.6, 'percent'),
      margin: formatEdgequityValue((stock.profitability.operatingMargin ?? 0.08) * 0.8, 'percent'),
      trigger: valuationModel ? 'Growth slows, margins compress, and valuation support weakens versus the base case assumptions.' : 'Growth slows, margins compress, or valuation multiple resets.',
    },
    {
      label: 'Base Case',
      kind: 'base',
      target: formatTarget(1.2, valuationModel?.basePriceTarget),
      returnText: formatReturn(valuationModel?.basePriceTarget, price === null ? 'Base case pending price data' : '+20% upside framework'),
      revenueCagr: formatEdgequityValue(stock.growth.revenueCagr3y ?? 0.05, 'percent'),
      margin: formatEdgequityValue(stock.profitability.operatingMargin ?? 0.12, 'percent'),
      trigger: valuationModel ? 'The core thesis holds, cash conversion remains durable, and the market continues to underwrite the base case assumptions.' : 'Core thesis holds and current cash conversion remains durable.',
    },
    {
      label: 'Bull Case',
      kind: 'bull',
      target: formatTarget(1.45, valuationModel?.bullPriceTarget),
      returnText: formatReturn(valuationModel?.bullPriceTarget, price === null ? 'Upside case pending price data' : '+45% upside framework'),
      revenueCagr: formatEdgequityValue((stock.growth.revenueCagr3y ?? 0.08) * 1.4, 'percent'),
      margin: formatEdgequityValue((stock.profitability.operatingMargin ?? 0.14) * 1.2, 'percent'),
      trigger: valuationModel ? 'Growth accelerates, margins stay stronger than expected, and the market gives more credit for the long-term opportunity.' : 'Growth accelerates, margins expand, and valuation support improves.',
    },
  ];
}

function formatPriceTarget(research: EdgequityResearchReportNote | undefined, scenarios: ReturnType<typeof buildScenarios>) {
  return research?.valuationModel
    ? formatEdgequityValue(research.valuationModel.basePriceTarget, 'money')
    : scenarios[1].target;
}

function formatTargetReturn(price: number | null, target: number | null) {
  if (price === null || target === null) return null;
  return `${formatSignedPercent((target / price) - 1)} to base target`;
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

function marketCapBand(marketCap: number): string {
  if (marketCap >= 200_000_000_000) return 'Mega Cap';
  if (marketCap >= 10_000_000_000) return 'Large Cap';
  if (marketCap >= 2_000_000_000) return 'Mid Cap';
  return 'Small Cap';
}

function buildEarningsRead(stock: EdgequityStockRecord, note: EdgequityAnalysisNote): string {
  const latestYear = stock.history[0];
  const revenue = formatEdgequityValue(latestYear?.revenue ?? null, 'money');
  const freeCashFlow = formatEdgequityValue(latestYear?.freeCashFlow ?? null, 'money');
  const operatingMargin = formatEdgequityValue(stock.profitability.operatingMargin, 'percent');
  const fcfMargin = formatEdgequityValue(stock.cashFlow.fcfMargin, 'percent');

  return `${stock.ticker} should be judged by whether the transcript narrative is supported by the numbers: latest revenue of ${revenue}, free cash flow of ${freeCashFlow}, operating margin of ${operatingMargin}, and FCF margin of ${fcfMargin}. ${note.valuationRead}`;
}

function reportTone(stock: EdgequityStockRecord): string {
  if ((stock.valuation.fcfYield ?? 0) >= 0.04 && (stock.profitability.operatingMargin ?? 0) >= 0.2) return 'Constructive';
  if ((stock.financialHealth.netDebtToEbitda ?? 99) > 4) return 'Watch';
  return 'Neutral';
}

function verdictClass(stock: EdgequityStockRecord): string {
  const tone = reportTone(stock);
  if (tone === 'Constructive') return 'verdict-buy';
  if (tone === 'Watch') return 'verdict-sell';
  return 'verdict-hold';
}

function ratingPillClass(stock: EdgequityStockRecord): string {
  const tone = reportTone(stock);
  if (tone === 'Constructive') return 'rating-buy';
  if (tone === 'Watch') return 'rating-sell';
  return 'rating-hold';
}

function formatCurrencyWithCode(stock: EdgequityStockRecord): string {
  if (stock.price === null) return '-';
  return `${stock.currency ?? 'USD'} ${formatEdgequityValue(stock.price, 'number')}`;
}

function HeaderMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase" style={{ color: 'var(--vw-text-tertiary)' }}>
        {label}
      </p>
      <p
        className={`font-mono text-sm font-semibold tabular-nums ${
          highlight ? 'text-[var(--vw-green)]' : 'text-[var(--vw-text-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FinancialsOverview({ stock }: { stock: EdgequityStockRecord }) {
  const latestYear = stock.history[0];
  const latestYearLabel = latestYear?.year ?? 'Latest period';
  const summaryMetrics = [
    { label: 'Latest reported year', value: latestYear?.year ?? '-', caption: 'Statement period' },
    { label: 'Revenue', value: formatEdgequityValue(latestYear?.revenue ?? null, 'money'), caption: 'Business scale' },
    { label: 'Gross Profit', value: formatEdgequityValue(latestYear?.grossProfit ?? null, 'money'), caption: 'After direct costs' },
    { label: 'Operating Income', value: formatEdgequityValue(latestYear?.operatingIncome ?? null, 'money'), caption: 'Core profit' },
    { label: 'Net Income', value: formatEdgequityValue(latestYear?.netIncome ?? null, 'money'), caption: 'Bottom-line earnings' },
    { label: 'Free Cash Flow', value: formatEdgequityValue(latestYear?.freeCashFlow ?? null, 'money'), caption: 'Cash after capex' },
  ];
  const financialSections = [
    {
      title: 'Profitability',
      metrics: [
        { label: 'Gross Margin', value: formatEdgequityValue(stock.profitability.grossMargin, 'percent') },
        { label: 'Operating Margin', value: formatEdgequityValue(stock.profitability.operatingMargin, 'percent') },
        { label: 'Net Margin', value: formatEdgequityValue(stock.profitability.netMargin, 'percent') },
        { label: 'ROE', value: formatEdgequityValue(stock.profitability.roe, 'percent') },
        { label: 'ROIC', value: formatEdgequityValue(stock.profitability.roic, 'percent') },
      ],
    },
    {
      title: 'Cash generation',
      metrics: [
        { label: 'Operating Cash Flow', value: formatEdgequityValue(stock.cashFlow.operatingCashFlow, 'money') },
        { label: 'Free Cash Flow', value: formatEdgequityValue(stock.cashFlow.freeCashFlow, 'money') },
        { label: 'FCF Margin', value: formatEdgequityValue(stock.cashFlow.fcfMargin, 'percent') },
        { label: 'FCF Conversion', value: formatEdgequityValue(stock.cashFlow.fcfConversion, 'percent') },
        { label: 'Capex / Revenue', value: formatEdgequityValue(stock.cashFlow.capexToRevenue, 'percent') },
      ],
    },
    {
      title: 'Capital structure',
      metrics: [
        { label: 'Market Cap', value: formatEdgequityValue(stock.marketCap, 'money') },
        { label: 'Enterprise Value', value: formatEdgequityValue(stock.enterpriseValue, 'money') },
        { label: 'Total Debt', value: formatEdgequityValue(latestYear?.totalDebt ?? null, 'money') },
        { label: 'Total Equity', value: formatEdgequityValue(latestYear?.totalEquity ?? null, 'money') },
        { label: 'Shares Diluted', value: formatShareCount(latestYear?.sharesDiluted ?? null) },
      ],
    },
    {
      title: 'Growth and balance sheet',
      metrics: [
        { label: 'Revenue CAGR 3Y', value: formatEdgequityValue(stock.growth.revenueCagr3y, 'percent') },
        { label: 'Revenue CAGR 5Y', value: formatEdgequityValue(stock.growth.revenueCagr5y, 'percent') },
        { label: 'FCF CAGR 3Y', value: formatEdgequityValue(stock.growth.fcfCagr3y, 'percent') },
        { label: 'Current Ratio', value: formatEdgequityValue(stock.financialHealth.currentRatio, 'number') },
        { label: 'Net Debt / EBITDA', value: formatEdgequityValue(stock.financialHealth.netDebtToEbitda, 'multiple') },
      ],
    },
  ];

  return (
    <div className="eq-financials-overview">
      <section className="eq-financials-summary">
        <div className="eq-financials-summary-head">
          <div>
            <p>Financial snapshot</p>
            <h3>{stock.ticker} operating profile</h3>
          </div>
          <span>{latestYearLabel}</span>
        </div>

        <div className="eq-financials-kpi-grid">
          {summaryMetrics.map((metric) => (
            <FinancialMetricCard key={metric.label} label={metric.label} value={metric.value} caption={metric.caption} />
          ))}
        </div>
      </section>

      <section className="eq-financials-section-grid">
        {financialSections.map((section) => (
          <article className="eq-financials-section" key={section.title}>
            <h3>{section.title}</h3>
            <dl>
              {section.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>

      <section className="eq-financials-metric-groups">
        <div className="eq-financials-subhead">
          <p>Screener metrics</p>
          <span>Same fields used in the main comparison table.</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {METRIC_GROUPS.map((group) => (
            <MetricGroupCard key={group.id} stock={stock} group={group} />
          ))}
        </div>
      </section>
    </div>
  );
}

function FinancialMetricCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  const isMissing = value === '-';

  return (
    <article className="eq-financials-kpi">
      <p>{label}</p>
      <strong className={isMissing ? 'is-missing' : ''}>{value}</strong>
      <span>{caption}</span>
    </article>
  );
}

function formatShareCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(2)}B`;
  }

  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
  }

  return `${sign}${absValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function MetricGroupCard({ stock, group }: { stock: EdgequityStockRecord; group: MetricGroupDefinition }) {
  const columns = getGroupColumns(group.id);

  return (
    <article className="eq-metric-panel">
      <h3 className="text-sm font-semibold uppercase" style={{ color: 'var(--vw-text-tertiary)' }}>
        {group.label}
      </h3>
      <dl className="mt-3">
        {columns.map((column) => {
          const formattedValue = formatEdgequityValue(getColumnValue(stock, column), column.format);
          const isMissing = formattedValue === '-';

          return (
            <div
              key={column.id}
              className="flex min-h-8 items-center justify-between gap-4 border-t border-[var(--vw-border-dim)] py-1.5 first:border-t-0"
            >
              <dt className="min-w-0 truncate text-sm" style={{ color: 'var(--vw-text-secondary)' }}>
                {column.label}
              </dt>
              <dd
                className="shrink-0 font-mono text-sm tabular-nums"
                style={{ color: isMissing ? 'var(--vw-text-tertiary)' : 'var(--vw-text-primary)' }}
              >
                {formattedValue}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
