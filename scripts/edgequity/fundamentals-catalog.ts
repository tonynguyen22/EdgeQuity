export type FundamentalsFormat = "money" | "percent" | "multiple" | "perShare";

export interface FundamentalsMetricDef {
  id: string;
  label: string;
  description: string;
  format: FundamentalsFormat;
  secConcepts?: string[];
  finnhubAnnualKeys?: string[];
  finnhubQuarterlyKeys?: string[];
}

export interface FundamentalsSectionDef {
  id: string;
  title: string;
  description: string;
  metrics: FundamentalsMetricDef[];
}

export const FUNDAMENTALS_CATALOG: FundamentalsSectionDef[] = [
  {
    id: "growth",
    title: "Growth",
    description: "Revenue, earnings, and EPS across recent reporting periods.",
    metrics: [
      {
        id: "revenue",
        label: "Revenue",
        description: "Revenue shows business scale and demand momentum.",
        format: "money",
        secConcepts: ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet", "Revenue"],
      },
      {
        id: "grossProfit",
        label: "Gross profit",
        description: "Gross profit tracks pricing power and direct cost structure.",
        format: "money",
        secConcepts: ["GrossProfit"],
      },
      {
        id: "operatingIncome",
        label: "Operating income",
        description: "Operating income reflects core profitability after operating expenses.",
        format: "money",
        secConcepts: ["OperatingIncomeLoss", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"],
      },
      {
        id: "pretaxIncome",
        label: "Pretax income",
        description: "Pretax income is earnings before income tax expense.",
        format: "money",
        secConcepts: [
          "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
          "IncomeBeforeIncomeTaxes",
        ],
      },
      {
        id: "netIncome",
        label: "Net income",
        description: "Net income is the profit remaining for shareholders.",
        format: "money",
        secConcepts: ["NetIncomeLoss", "ProfitLoss", "NetIncomeLossAvailableToCommonStockholdersBasic"],
      },
      {
        id: "eps",
        label: "EPS (diluted)",
        description: "Earnings per share shows profit allocated to each share.",
        format: "perShare",
        secConcepts: ["EarningsPerShareDiluted", "EarningsPerShareBasic"],
        finnhubAnnualKeys: ["eps"],
        finnhubQuarterlyKeys: ["eps", "epsTTM"],
      },
    ],
  },
  {
    id: "margins",
    title: "Margins & efficiency",
    description: "ROE, ROA, and margin trends help assess earnings quality.",
    metrics: [
      {
        id: "grossMargin",
        label: "Gross margin",
        description: "Gross margin reflects pricing power and direct cost control.",
        format: "percent",
        finnhubAnnualKeys: ["grossMargin"],
        finnhubQuarterlyKeys: ["grossMargin"],
      },
      {
        id: "operatingMargin",
        label: "Operating margin",
        description: "Operating margin shows operating efficiency after core expenses.",
        format: "percent",
        finnhubAnnualKeys: ["operatingMargin"],
        finnhubQuarterlyKeys: ["operatingMargin"],
      },
      {
        id: "netMargin",
        label: "Net margin",
        description: "Net margin shows how much revenue converts to bottom-line profit.",
        format: "percent",
        finnhubAnnualKeys: ["netProfitMargin", "netMargin"],
        finnhubQuarterlyKeys: ["netProfitMargin", "netMargin"],
      },
      {
        id: "opexToRevenue",
        label: "Operating expenses / revenue",
        description: "Operating expense ratio; lower can indicate leaner operations.",
        format: "percent",
        finnhubAnnualKeys: ["sgaToSale"],
        finnhubQuarterlyKeys: ["sgaToSale"],
      },
    ],
  },
  {
    id: "balance",
    title: "Balance sheet",
    description: "Asset scale, equity cushion, and debt levels.",
    metrics: [
      {
        id: "totalAssets",
        label: "Total assets",
        description: "Total assets measure balance sheet scale.",
        format: "money",
        secConcepts: ["Assets"],
      },
      {
        id: "cash",
        label: "Cash and equivalents",
        description: "Cash and equivalents support liquidity and flexibility.",
        format: "money",
        secConcepts: ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsAndShortTermInvestments"],
      },
      {
        id: "receivables",
        label: "Receivables",
        description: "Receivables reflect credit extended to customers.",
        format: "money",
        secConcepts: ["AccountsReceivableNetCurrent", "ReceivablesNetCurrent", "AccountsReceivableNet"],
      },
      {
        id: "inventory",
        label: "Inventory",
        description: "Inventory is goods held for sale or production.",
        format: "money",
        secConcepts: ["InventoryNet", "Inventory"],
      },
      {
        id: "equity",
        label: "Stockholders' equity",
        description: "Equity is the shareholder-owned capital cushion.",
        format: "money",
        secConcepts: ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
      },
      {
        id: "shortTermDebt",
        label: "Short-term debt",
        description: "Short-term borrowings due within one year.",
        format: "money",
        secConcepts: ["ShortTermBorrowings", "LongTermDebtCurrent", "DebtCurrent"],
      },
      {
        id: "longTermDebt",
        label: "Long-term debt",
        description: "Long-term debt funds the business beyond one year.",
        format: "money",
        secConcepts: ["LongTermDebtNoncurrent", "LongTermDebt"],
      },
    ],
  },
  {
    id: "leverage",
    title: "Leverage",
    description: "Debt relative to equity and assets when data is available.",
    metrics: [
      {
        id: "debtToEquity",
        label: "Debt / equity",
        description: "Debt-to-equity measures reliance on borrowing versus equity.",
        format: "percent",
        finnhubAnnualKeys: ["totalDebtToEquity", "longtermDebtTotalEquity"],
        finnhubQuarterlyKeys: ["totalDebtToEquity", "longtermDebtTotalEquity"],
      },
      {
        id: "debtToAssets",
        label: "Debt / assets",
        description: "Debt-to-assets shows how much of the balance sheet is debt-funded.",
        format: "percent",
        finnhubAnnualKeys: ["totalDebtToTotalAsset", "longtermDebtTotalAsset"],
        finnhubQuarterlyKeys: ["totalDebtToTotalAsset", "longtermDebtTotalAsset"],
      },
    ],
  },
  {
    id: "valuation",
    title: "Valuation",
    description: "Common market multiples and per-share valuation metrics.",
    metrics: [
      {
        id: "pe",
        label: "P/E",
        description: "Price-to-earnings shows how many times earnings the market pays.",
        format: "multiple",
        finnhubAnnualKeys: ["pe"],
        finnhubQuarterlyKeys: ["peTTM", "pe"],
      },
      {
        id: "pb",
        label: "P/B",
        description: "Price-to-book compares market value to book equity.",
        format: "multiple",
        finnhubAnnualKeys: ["pb"],
        finnhubQuarterlyKeys: ["pb"],
      },
      {
        id: "ps",
        label: "P/S",
        description: "Price-to-sales relates market cap to revenue.",
        format: "multiple",
        finnhubAnnualKeys: ["ps"],
        finnhubQuarterlyKeys: ["psTTM", "ps"],
      },
      {
        id: "epsValuation",
        label: "EPS",
        description: "Earnings per share used in valuation and growth analysis.",
        format: "perShare",
        finnhubAnnualKeys: ["eps"],
        finnhubQuarterlyKeys: ["eps", "epsTTM"],
      },
      {
        id: "bookValuePerShare",
        label: "Book value per share",
        description: "Book value per share is equity per share on the balance sheet.",
        format: "perShare",
        finnhubAnnualKeys: ["bookValue"],
        finnhubQuarterlyKeys: ["bookValue"],
      },
      {
        id: "dividendYield",
        label: "Dividend yield",
        description: "Indicated dividend yield based on recent distributions.",
        format: "percent",
        finnhubAnnualKeys: ["dividendYieldIndicatedAnnual"],
        finnhubQuarterlyKeys: ["dividendYieldIndicatedAnnual", "currentDividendYieldTTM"],
      },
      {
        id: "evEbitda",
        label: "EV / EBITDA",
        description: "Enterprise value to EBITDA is a common capital-structure-aware multiple.",
        format: "multiple",
        finnhubAnnualKeys: ["evEbitda"],
        finnhubQuarterlyKeys: ["evEbitdaTTM", "evEbitda"],
      },
    ],
  },
];
