# Finnhub API Reference

---

## Stock Metric (Basic Financials)

**Endpoint:**
```
https://finnhub.io/api/v1/stock/metric?symbol={symbol}&metric=all&token={API_KEY}
```

**Method:** `GET`

**Parameters:**
| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| `symbol`  | string | Stock ticker symbol (e.g. `AAPL`)    |
| `metric`  | string | Metric type. Use `all` for all data  |
| `token`   | string | Your Finnhub API key                 |

---

### Response Structure

The response contains three top-level keys:

| Key          | Type   | Description                                      |
|--------------|--------|--------------------------------------------------|
| `metric`     | object | Current/latest financial metrics (snapshot)       |
| `metricType` | string | The metric type requested (e.g. `"all"`)          |
| `series`     | object | Historical time-series data (annual & quarterly)  |

---

### `metric` — Snapshot Metrics

#### Trading & Price Performance

| Field                           | Description                                        |
|---------------------------------|----------------------------------------------------|
| `10DayAverageTradingVolume`     | 10-day average trading volume                      |
| `13WeekPriceReturnDaily`        | 13-week price return (daily)                       |
| `26WeekPriceReturnDaily`        | 26-week price return (daily)                       |
| `3MonthADReturnStd`             | 3-month average daily return standard deviation    |
| `3MonthAverageTradingVolume`    | 3-month average trading volume                     |
| `52WeekHigh`                    | 52-week high price                                 |
| `52WeekHighDate`                | Date of 52-week high                               |
| `52WeekLow`                     | 52-week low price                                  |
| `52WeekLowDate`                 | Date of 52-week low                                |
| `52WeekPriceReturnDaily`        | 52-week price return (daily)                       |
| `5DayPriceReturnDaily`          | 5-day price return (daily)                         |
| `monthToDatePriceReturnDaily`   | Month-to-date price return (daily)                 |
| `yearToDatePriceReturnDaily`    | Year-to-date price return (daily)                  |
| `beta`                          | Beta coefficient                                   |

#### Price Relative to S&P 500

| Field                               | Description                                  |
|-------------------------------------|----------------------------------------------|
| `priceRelativeToS&P50013Week`       | Price relative to S&P 500 — 13 weeks         |
| `priceRelativeToS&P50026Week`       | Price relative to S&P 500 — 26 weeks         |
| `priceRelativeToS&P5004Week`        | Price relative to S&P 500 — 4 weeks          |
| `priceRelativeToS&P50052Week`       | Price relative to S&P 500 — 52 weeks         |
| `priceRelativeToS&P500Ytd`          | Price relative to S&P 500 — YTD              |

#### Valuation Ratios

| Field                            | Description                                       |
|----------------------------------|---------------------------------------------------|
| `peAnnual`                       | Price-to-Earnings ratio (annual)                   |
| `peTTM`                         | Price-to-Earnings ratio (trailing twelve months)   |
| `peBasicExclExtraTTM`           | P/E basic excluding extraordinary items (TTM)      |
| `peExclExtraAnnual`             | P/E excluding extraordinary items (annual)         |
| `peExclExtraTTM`                | P/E excluding extraordinary items (TTM)            |
| `peInclExtraTTM`                | P/E including extraordinary items (TTM)            |
| `peNormalizedAnnual`            | Normalized P/E (annual)                            |
| `forwardPE`                     | Forward Price-to-Earnings ratio                    |
| `pegTTM`                        | PEG ratio (TTM)                                    |
| `pbAnnual`                      | Price-to-Book ratio (annual)                       |
| `pbQuarterly`                   | Price-to-Book ratio (quarterly)                    |
| `pb`                            | Price-to-Book ratio (current)                      |
| `psAnnual`                      | Price-to-Sales ratio (annual)                      |
| `psTTM`                         | Price-to-Sales ratio (TTM)                         |
| `pcfShareAnnual`                | Price-to-Cash-Flow per share (annual)              |
| `pcfShareTTM`                   | Price-to-Cash-Flow per share (TTM)                 |
| `pfcfShareAnnual`               | Price-to-Free-Cash-Flow per share (annual)         |
| `pfcfShareTTM`                  | Price-to-Free-Cash-Flow per share (TTM)            |
| `ptbvAnnual`                    | Price-to-Tangible-Book-Value (annual)              |
| `ptbvQuarterly`                 | Price-to-Tangible-Book-Value (quarterly)           |
| `currentEv/freeCashFlowAnnual`  | EV/Free Cash Flow (annual)                         |
| `currentEv/freeCashFlowTTM`     | EV/Free Cash Flow (TTM)                            |
| `evEbitdaTTM`                   | EV/EBITDA (TTM)                                    |
| `evRevenueTTM`                  | EV/Revenue (TTM)                                   |
| `enterpriseValue`               | Enterprise Value                                   |
| `marketCapitalization`          | Market Capitalization                              |

#### Per-Share Data

| Field                              | Description                                    |
|------------------------------------|------------------------------------------------|
| `bookValuePerShareAnnual`          | Book value per share (annual)                  |
| `bookValuePerShareQuarterly`       | Book value per share (quarterly)               |
| `cashFlowPerShareAnnual`          | Cash flow per share (annual)                   |
| `cashFlowPerShareQuarterly`       | Cash flow per share (quarterly)                |
| `cashFlowPerShareTTM`             | Cash flow per share (TTM)                      |
| `cashPerSharePerShareAnnual`      | Cash per share (annual)                        |
| `cashPerSharePerShareQuarterly`   | Cash per share (quarterly)                     |
| `revenuePerShareAnnual`           | Revenue per share (annual)                     |
| `revenuePerShareTTM`              | Revenue per share (TTM)                        |
| `tangibleBookValuePerShareAnnual`       | Tangible book value per share (annual)    |
| `tangibleBookValuePerShareQuarterly`    | Tangible book value per share (quarterly) |

#### EPS (Earnings Per Share)

| Field                              | Description                                    |
|------------------------------------|------------------------------------------------|
| `epsAnnual`                        | EPS (annual)                                   |
| `epsTTM`                          | EPS (TTM)                                      |
| `epsBasicExclExtraItemsAnnual`    | EPS basic excluding extra items (annual)       |
| `epsBasicExclExtraItemsTTM`       | EPS basic excluding extra items (TTM)          |
| `epsExclExtraItemsAnnual`         | EPS excluding extra items (annual)             |
| `epsExclExtraItemsTTM`            | EPS excluding extra items (TTM)                |
| `epsInclExtraItemsAnnual`         | EPS including extra items (annual)             |
| `epsInclExtraItemsTTM`            | EPS including extra items (TTM)                |
| `epsNormalizedAnnual`             | Normalized EPS (annual)                        |
| `epsGrowth3Y`                     | EPS growth 3-year                              |
| `epsGrowth5Y`                     | EPS growth 5-year                              |
| `epsGrowthQuarterlyYoy`           | EPS growth quarterly year-over-year            |
| `epsGrowthTTMYoy`                 | EPS growth TTM year-over-year                  |

#### EBITDA

| Field                    | Description                          |
|--------------------------|--------------------------------------|
| `ebitdPerShareAnnual`    | EBITD per share (annual)             |
| `ebitdPerShareTTM`       | EBITD per share (TTM)                |
| `ebitdaCagr5Y`           | EBITDA CAGR 5-year                   |
| `ebitdaInterimCagr5Y`    | EBITDA interim CAGR 5-year           |

#### Dividends

| Field                            | Description                              |
|----------------------------------|------------------------------------------|
| `currentDividendYieldTTM`        | Current dividend yield (TTM)             |
| `dividendGrowthRate5Y`           | Dividend growth rate 5-year              |
| `dividendIndicatedAnnual`        | Indicated annual dividend                |
| `dividendPerShareAnnual`         | Dividend per share (annual)              |
| `dividendPerShareTTM`            | Dividend per share (TTM)                 |
| `dividendYieldIndicatedAnnual`   | Indicated annual dividend yield          |
| `payoutRatioAnnual`              | Payout ratio (annual)                    |
| `payoutRatioTTM`                 | Payout ratio (TTM)                       |

#### Profitability Margins

| Field                    | Description                          |
|--------------------------|--------------------------------------|
| `grossMargin5Y`          | Gross margin 5-year average          |
| `grossMarginAnnual`      | Gross margin (annual)                |
| `grossMarginTTM`         | Gross margin (TTM)                   |
| `netProfitMargin5Y`      | Net profit margin 5-year average     |
| `netProfitMarginAnnual`  | Net profit margin (annual)           |
| `netProfitMarginTTM`     | Net profit margin (TTM)              |
| `netMarginGrowth5Y`      | Net margin growth 5-year             |
| `operatingMargin5Y`      | Operating margin 5-year average      |
| `operatingMarginAnnual`  | Operating margin (annual)            |
| `operatingMarginTTM`     | Operating margin (TTM)               |
| `pretaxMargin5Y`         | Pretax margin 5-year average         |
| `pretaxMarginAnnual`     | Pretax margin (annual)               |
| `pretaxMarginTTM`        | Pretax margin (TTM)                  |

#### Returns

| Field          | Description                                  |
|----------------|----------------------------------------------|
| `roa5Y`        | Return on Assets 5-year average              |
| `roaRfy`       | Return on Assets (recent fiscal year)        |
| `roaTTM`       | Return on Assets (TTM)                       |
| `roe5Y`        | Return on Equity 5-year average              |
| `roeRfy`       | Return on Equity (recent fiscal year)        |
| `roeTTM`       | Return on Equity (TTM)                       |
| `roi5Y`        | Return on Investment 5-year average          |
| `roiAnnual`    | Return on Investment (annual)                |
| `roiTTM`       | Return on Investment (TTM)                   |

#### Liquidity & Efficiency

| Field                        | Description                                |
|------------------------------|--------------------------------------------|
| `currentRatioAnnual`         | Current ratio (annual)                     |
| `currentRatioQuarterly`      | Current ratio (quarterly)                  |
| `quickRatioAnnual`           | Quick ratio (annual)                       |
| `quickRatioQuarterly`        | Quick ratio (quarterly)                    |
| `assetTurnoverAnnual`        | Asset turnover (annual)                    |
| `assetTurnoverTTM`           | Asset turnover (TTM)                       |
| `inventoryTurnoverAnnual`    | Inventory turnover (annual)                |
| `inventoryTurnoverTTM`       | Inventory turnover (TTM)                   |
| `receivablesTurnoverAnnual`  | Receivables turnover (annual)              |
| `receivablesTurnoverTTM`     | Receivables turnover (TTM)                 |

#### Leverage & Debt

| Field                                  | Description                                      |
|----------------------------------------|--------------------------------------------------|
| `longTermDebt/equityAnnual`            | Long-term debt to equity (annual)                |
| `longTermDebt/equityQuarterly`         | Long-term debt to equity (quarterly)             |
| `totalDebt/totalEquityAnnual`          | Total debt to total equity (annual)              |
| `totalDebt/totalEquityQuarterly`       | Total debt to total equity (quarterly)           |
| `netInterestCoverageAnnual`            | Net interest coverage (annual)                   |
| `netInterestCoverageTTM`               | Net interest coverage (TTM)                      |

#### Revenue Growth

| Field                        | Description                                |
|------------------------------|--------------------------------------------|
| `revenueGrowth3Y`           | Revenue growth 3-year                      |
| `revenueGrowth5Y`           | Revenue growth 5-year                      |
| `revenueGrowthQuarterlyYoy` | Revenue growth quarterly year-over-year    |
| `revenueGrowthTTMYoy`       | Revenue growth TTM year-over-year          |
| `revenueShareGrowth5Y`      | Revenue per share growth 5-year            |

#### Other Metrics

| Field                        | Description                                |
|------------------------------|--------------------------------------------|
| `bookValueShareGrowth5Y`    | Book value per share growth 5-year         |
| `capexCagr5Y`               | CapEx CAGR 5-year                          |
| `focfCagr5Y`                | Free operating cash flow CAGR 5-year       |
| `tbvCagr5Y`                 | Tangible book value CAGR 5-year            |
| `netIncomeEmployeeAnnual`   | Net income per employee (annual)           |
| `netIncomeEmployeeTTM`      | Net income per employee (TTM)              |
| `revenueEmployeeAnnual`     | Revenue per employee (annual)              |
| `revenueEmployeeTTM`        | Revenue per employee (TTM)                 |

---

### `series` — Historical Time-Series Data

Contains `annual` and `quarterly` objects, each with arrays of `{ period, v }` entries. `period` is the fiscal period end date (e.g. `"2025-09-27"`), `v` is the value.

#### Annual Series

| Field                        | Description                                    |
|------------------------------|------------------------------------------------|
| `bookValue`                  | Total book value (equity)                      |
| `cashRatio`                  | Cash ratio                                     |
| `currentRatio`               | Current ratio                                  |
| `ebitPerShare`               | EBIT per share                                 |
| `eps`                        | Earnings per share                             |
| `ev`                         | Enterprise value                               |
| `evEbitda`                   | EV/EBITDA                                      |
| `evRevenue`                  | EV/Revenue                                     |
| `fcfMargin`                  | Free cash flow margin                          |
| `grossMargin`                | Gross margin                                   |
| `inventoryTurnover`          | Inventory turnover                             |
| `longtermDebtTotalAsset`     | Long-term debt to total assets                 |
| `longtermDebtTotalCapital`   | Long-term debt to total capital                |
| `longtermDebtTotalEquity`    | Long-term debt to total equity                 |
| `netDebtToTotalCapital`      | Net debt to total capital                      |
| `netDebtToTotalEquity`       | Net debt to total equity                       |
| `netMargin`                  | Net profit margin                              |
| `operatingMargin`            | Operating margin                               |
| `payoutRatio`                | Dividend payout ratio                          |
| `pb`                         | Price-to-Book ratio                            |
| `pe`                         | Price-to-Earnings ratio                        |
| `pfcf`                       | Price-to-Free-Cash-Flow                        |
| `pretaxMargin`               | Pretax margin                                  |
| `ps`                         | Price-to-Sales ratio                           |
| `ptbv`                       | Price-to-Tangible-Book-Value                   |
| `quickRatio`                 | Quick ratio                                    |
| `receivablesTurnover`        | Receivables turnover                           |
| `roa`                        | Return on Assets                               |
| `roe`                        | Return on Equity                               |
| `roic`                       | Return on Invested Capital                     |
| `rotc`                       | Return on Total Capital                        |
| `salesPerShare`              | Sales (revenue) per share                      |
| `sgaToSale`                  | SGA to sales ratio                             |
| `tangibleBookValue`          | Tangible book value                            |
| `totalDebtToEquity`          | Total debt to equity                           |
| `totalDebtToTotalAsset`      | Total debt to total assets                     |
| `totalDebtToTotalCapital`    | Total debt to total capital                    |
| `totalRatio`                 | Total ratio                                    |

#### Quarterly Series

| Field                        | Description                                    |
|------------------------------|------------------------------------------------|
| `assetTurnoverTTM`           | Asset turnover (TTM, quarterly data points)    |
| `bookValue`                  | Book value (quarterly)                         |
| `cashRatio`                  | Cash ratio (quarterly)                         |
| `currentRatio`               | Current ratio (quarterly)                      |
| `ebitPerShare`               | EBIT per share (quarterly)                     |
| `eps`                        | Earnings per share (quarterly)                 |
| `ev`                         | Enterprise value (quarterly)                   |
| `evEbitdaTTM`                | EV/EBITDA TTM (quarterly data points)          |
| `evRevenueTTM`               | EV/Revenue TTM (quarterly data points)         |
| `fcfMargin`                  | Free cash flow margin (quarterly)              |
| `fcfPerShareTTM`             | Free cash flow per share TTM (quarterly pts)   |
| `grossMargin`                | Gross margin (quarterly)                       |
| `inventoryTurnoverTTM`       | Inventory turnover TTM (quarterly data points) |
| `longtermDebtTotalAsset`     | Long-term debt to total assets (quarterly)     |
| `longtermDebtTotalCapital`   | Long-term debt to total capital (quarterly)    |
| `longtermDebtTotalEquity`    | Long-term debt to total equity (quarterly)     |
| `netDebtToTotalCapital`      | Net debt to total capital (quarterly)          |
| `netDebtToTotalEquity`       | Net debt to total equity (quarterly)           |
| `netMargin`                  | Net margin (quarterly)                         |
| `operatingMargin`            | Operating margin (quarterly)                   |
| `payoutRatioTTM`             | Payout ratio TTM (quarterly data points)       |
| `pb`                         | Price-to-Book (quarterly)                      |
| `peTTM`                      | P/E TTM (quarterly data points)                |
| `pfcfTTM`                    | Price-to-FCF TTM (quarterly data points)       |
| `pretaxMargin`               | Pretax margin (quarterly)                      |
| `psTTM`                      | Price-to-Sales TTM (quarterly data points)     |
| `ptbv`                       | Price-to-Tangible-Book-Value (quarterly)       |
| `quickRatio`                 | Quick ratio (quarterly)                        |
| `receivablesTurnover`        | Receivables turnover (quarterly)               |
| `roa`                        | Return on Assets (quarterly)                   |
| `roe`                        | Return on Equity (quarterly)                   |
| `roic`                       | Return on Invested Capital (quarterly)         |
| `rotc`                       | Return on Total Capital (quarterly)            |
| `salesPerShare`              | Sales per share (quarterly)                    |
| `sgaToSale`                  | SGA to sales ratio (quarterly)                 |
| `tangibleBookValue`          | Tangible book value (quarterly)                |
| `totalDebtToEquity`          | Total debt to equity (quarterly)               |
| `totalDebtToTotalAsset`      | Total debt to total assets (quarterly)         |
| `totalDebtToTotalCapital`    | Total debt to total capital (quarterly)        |
| `totalRatio`                 | Total ratio (quarterly)                        |

---

## Quote

Get real-time quote data for US stocks. Constant polling is not recommended — use websocket for real-time updates.

**Endpoint:**
```
https://finnhub.io/api/v1/quote?symbol={symbol}&token={API_KEY}
```

**Method:** `GET`

**Parameters:**
| Parameter | Type   | Required | Description                       |
|-----------|--------|----------|-----------------------------------|
| `symbol`  | string | Yes      | Stock ticker symbol (e.g. `AAPL`) |
| `token`   | string | Yes      | Your Finnhub API key              |

### Response Attributes

| Field | Description                |
|-------|----------------------------|
| `c`   | Current price              |
| `d`   | Change                     |
| `dp`  | Percent change             |
| `h`   | High price of the day      |
| `l`   | Low price of the day       |
| `o`   | Open price of the day      |
| `pc`  | Previous close price       |
| `t`   | Timestamp (UNIX)           |

---

## Insider Sentiment

Get insider sentiment data for US companies. The MSPR (Monthly Share Purchase Ratio) ranges from -100 (most negative) to 100 (most positive), which can signal price changes in the coming 30-90 days.

**Endpoint:**
```
https://finnhub.io/api/v1/stock/insider-sentiment?symbol={symbol}&from={from}&to={to}&token={API_KEY}
```

**Method:** `GET`

**Parameters:**
| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| `symbol`  | string | Yes      | Stock ticker symbol (e.g. `TSLA`)    |
| `from`    | string | Yes      | From date (e.g. `2015-01-01`)        |
| `to`      | string | Yes      | To date (e.g. `2022-03-01`)          |
| `token`   | string | Yes      | Your Finnhub API key                 |

### Response Attributes

| Field    | Description                                                |
|----------|------------------------------------------------------------|
| `symbol` | Symbol of the company (top-level)                          |
| `data`   | Array of sentiment data (see below)                        |

#### `data` array items

| Field    | Description                                                |
|----------|------------------------------------------------------------|
| `symbol` | Symbol                                                     |
| `year`   | Year                                                       |
| `month`  | Month                                                      |
| `change` | Net buying/selling from all insiders' transactions         |
| `mspr`   | Monthly share purchase ratio (-100 to 100)                 |

---

## Insider Transactions

Company insider transactions data sourced from Form 3, 4, 5, SEDI and relevant companies' filings. Covers US, UK, Canada, Australia, India, and all major EU markets. Limited to 100 transactions per API call.

**Endpoint:**
```
https://finnhub.io/api/v1/stock/insider-transactions?symbol={symbol}&token={API_KEY}
```

**Method:** `GET`

**Parameters:**
| Parameter | Type   | Required | Description                                                          |
|-----------|--------|----------|----------------------------------------------------------------------|
| `symbol`  | string | Yes      | Stock ticker symbol (e.g. `TSLA`). Leave blank for latest transactions |
| `from`    | string | No       | From date (e.g. `2020-03-15`)                                        |
| `to`      | string | No       | To date (e.g. `2020-03-16`)                                          |
| `token`   | string | Yes      | Your Finnhub API key                                                 |

### Response Attributes

| Field    | Description                                    |
|----------|------------------------------------------------|
| `symbol` | Symbol of the company (top-level)              |
| `data`   | Array of insider transactions (see below)      |

#### `data` array items

| Field              | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `name`             | Insider's name                                                              |
| `share`            | Number of shares held after the transaction                                 |
| `change`           | Number of shares changed. Positive = BUY, Negative = SELL                   |
| `filingDate`       | Filing date                                                                 |
| `transactionDate`  | Transaction date                                                            |
| `transactionPrice` | Average transaction price                                                   |
| `transactionCode`  | Transaction code (see Finnhub docs for code meanings)                       |
| `symbol`           | Symbol                                                                      |

---

## Company News

List latest company news by symbol. Only available for North American companies. Free tier includes 1 year of historical news and new updates.

**Endpoint:**
```
https://finnhub.io/api/v1/company-news?symbol={symbol}&from={from}&to={to}&token={API_KEY}
```

**Method:** `GET`

**Parameters:**
| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| `symbol`  | string | Yes      | Stock ticker symbol (e.g. `AAPL`)    |
| `from`    | string | Yes      | From date `YYYY-MM-DD`               |
| `to`      | string | Yes      | To date `YYYY-MM-DD`                 |
| `token`   | string | Yes      | Your Finnhub API key                 |

### Response Attributes

Returns an array of news objects:

| Field      | Description                                                              |
|------------|--------------------------------------------------------------------------|
| `id`       | News ID (can be used for `minId` param to get only latest news)          |
| `category` | News category                                                            |
| `headline` | News headline                                                            |
| `summary`  | News summary                                                             |
| `source`   | News source                                                              |
| `url`      | URL of the original article                                              |
| `image`    | Thumbnail image URL                                                      |
| `related`  | Related stocks and companies mentioned in the article                    |
| `datetime` | Published time in UNIX timestamp                                         |
