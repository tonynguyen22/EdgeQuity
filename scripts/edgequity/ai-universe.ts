export type AiInfrastructureTheme =
  | "AI Semiconductors"
  | "Semiconductor Equipment"
  | "Cloud & AI Platforms"
  | "Enterprise AI Software"
  | "Cybersecurity"
  | "Data Center Networking"
  | "AI Servers & Hardware"
  | "Power & Cooling Infrastructure"
  | "Data Center REITs"
  | "AI Apps & Automation";

export interface AiInfrastructureUniverseStock {
  ticker: string;
  displayTicker: string;
  theme: AiInfrastructureTheme;
  notes?: string;
}

export const AI_INFRASTRUCTURE_UNIVERSE: AiInfrastructureUniverseStock[] = [
  { ticker: "NVDA", displayTicker: "NVDA", theme: "AI Semiconductors" },
  { ticker: "AMD", displayTicker: "AMD", theme: "AI Semiconductors" },
  { ticker: "AVGO", displayTicker: "AVGO", theme: "AI Semiconductors" },
  { ticker: "TSM", displayTicker: "TSM", theme: "AI Semiconductors", notes: "Finnhub profile resolves to the Taiwan listing; normalize currency before market-cap ranking." },
  { ticker: "ASML", displayTicker: "ASML", theme: "AI Semiconductors", notes: "Finnhub profile resolves to Amsterdam; normalize currency before market-cap ranking." },
  { ticker: "ARM", displayTicker: "ARM", theme: "AI Semiconductors" },
  { ticker: "QCOM", displayTicker: "QCOM", theme: "AI Semiconductors" },
  { ticker: "MRVL", displayTicker: "MRVL", theme: "AI Semiconductors" },
  { ticker: "MU", displayTicker: "MU", theme: "AI Semiconductors" },
  { ticker: "AMAT", displayTicker: "AMAT", theme: "Semiconductor Equipment" },
  { ticker: "LRCX", displayTicker: "LRCX", theme: "Semiconductor Equipment" },
  { ticker: "KLAC", displayTicker: "KLAC", theme: "Semiconductor Equipment" },
  { ticker: "MSFT", displayTicker: "MSFT", theme: "Cloud & AI Platforms" },
  { ticker: "GOOG", displayTicker: "GOOG", theme: "Cloud & AI Platforms" },
  { ticker: "AMZN", displayTicker: "AMZN", theme: "Cloud & AI Platforms" },
  { ticker: "META", displayTicker: "META", theme: "Cloud & AI Platforms" },
  { ticker: "ORCL", displayTicker: "ORCL", theme: "Cloud & AI Platforms" },
  { ticker: "PLTR", displayTicker: "PLTR", theme: "Enterprise AI Software" },
  { ticker: "CRM", displayTicker: "CRM", theme: "Enterprise AI Software" },
  { ticker: "NOW", displayTicker: "NOW", theme: "Enterprise AI Software" },
  { ticker: "ADBE", displayTicker: "ADBE", theme: "Enterprise AI Software" },
  { ticker: "SNOW", displayTicker: "SNOW", theme: "Enterprise AI Software" },
  { ticker: "MDB", displayTicker: "MDB", theme: "Enterprise AI Software" },
  { ticker: "DDOG", displayTicker: "DDOG", theme: "Enterprise AI Software" },
  { ticker: "INTU", displayTicker: "INTU", theme: "Enterprise AI Software" },
  { ticker: "CRWD", displayTicker: "CRWD", theme: "Cybersecurity" },
  { ticker: "PANW", displayTicker: "PANW", theme: "Cybersecurity" },
  { ticker: "ZS", displayTicker: "ZS", theme: "Cybersecurity" },
  { ticker: "FTNT", displayTicker: "FTNT", theme: "Cybersecurity" },
  { ticker: "OKTA", displayTicker: "OKTA", theme: "Cybersecurity" },
  { ticker: "NET", displayTicker: "NET", theme: "Cybersecurity" },
  { ticker: "ANET", displayTicker: "ANET", theme: "Data Center Networking" },
  { ticker: "CSCO", displayTicker: "CSCO", theme: "Data Center Networking" },
  { ticker: "DELL", displayTicker: "DELL", theme: "AI Servers & Hardware" },
  { ticker: "HPE", displayTicker: "HPE", theme: "AI Servers & Hardware" },
  { ticker: "SMCI", displayTicker: "SMCI", theme: "AI Servers & Hardware" },
  { ticker: "NTAP", displayTicker: "NTAP", theme: "AI Servers & Hardware" },
  { ticker: "WDC", displayTicker: "WDC", theme: "AI Servers & Hardware" },
  { ticker: "VRT", displayTicker: "VRT", theme: "Power & Cooling Infrastructure" },
  { ticker: "ETN", displayTicker: "ETN", theme: "Power & Cooling Infrastructure" },
  { ticker: "GEV", displayTicker: "GEV", theme: "Power & Cooling Infrastructure" },
  { ticker: "CEG", displayTicker: "CEG", theme: "Power & Cooling Infrastructure" },
  { ticker: "VST", displayTicker: "VST", theme: "Power & Cooling Infrastructure" },
  { ticker: "NRG", displayTicker: "NRG", theme: "Power & Cooling Infrastructure" },
  { ticker: "EQIX", displayTicker: "EQIX", theme: "Data Center REITs" },
  { ticker: "DLR", displayTicker: "DLR", theme: "Data Center REITs" },
  { ticker: "APP", displayTicker: "APP", theme: "AI Apps & Automation" },
  { ticker: "PATH", displayTicker: "PATH", theme: "AI Apps & Automation" },
  { ticker: "UBER", displayTicker: "UBER", theme: "AI Apps & Automation" },
  { ticker: "TSLA", displayTicker: "TSLA", theme: "AI Apps & Automation" },
];

export const AI_INFRASTRUCTURE_THEME_BY_TICKER: Record<string, AiInfrastructureTheme> =
  Object.fromEntries(AI_INFRASTRUCTURE_UNIVERSE.map((stock) => [stock.ticker, stock.theme])) as Record<string, AiInfrastructureTheme>;
