export const EDGEQUITY_SUPPORTED_TICKERS = [
  'AAPL', 'TSLA', 'AMZN', 'MSFT', 'NVDA', 'GOOGL', 'META', 'NFLX',
  'JPM', 'V', 'BAC', 'PYPL', 'DIS', 'T', 'PFE', 'COST',
  'INTC', 'KO', 'TGT', 'NKE', 'BA', 'BABA', 'XOM',
  'WMT', 'GE', 'CSCO', 'VZ', 'JNJ', 'CVX', 'PLTR', 'SQ',
  'SHOP', 'SBUX', 'SOFI', 'HOOD', 'RBLX', 'SNAP', 'AMD', 'UBER',
  'FDX', 'ABBV', 'ETSY', 'MRNA', 'LMT', 'GM', 'F', 'LCID',
  'CCL', 'DAL', 'UAL', 'AAL', 'TSM', 'SONY', 'ET', 'MRO',
  'COIN', 'RIVN', 'RIOT', 'CPRX', 'NOK', 'ROKU',
  'VIAC', 'ATVI', 'BIDU', 'DOCU', 'ZM', 'PINS', 'TLRY', 'WBA',
  'MGM', 'NIO', 'C', 'GS', 'WFC', 'ADBE', 'PEP', 'UNH',
  'CARR', 'HCA', 'TWTR', 'BILI', 'SIRI', 'FUBO', 'RKT',
] as const;

export type EdgequityTicker = typeof EDGEQUITY_SUPPORTED_TICKERS[number];
