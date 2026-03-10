// ── Hover Card Descriptions ──────────────────────────────────────────────────
// Plain-English explanations for every indicator, written for an audience
// with zero finance or technical analysis knowledge.

export interface HoverDescription {
  what: string;
  reading: (value: number) => string;
  howTo: string;
}

const descriptions: Record<string, HoverDescription> = {
  rsi: {
    what: 'RSI measures how fast a stock\'s price has been going up or down recently. Think of it like a speedometer for stock momentum — it tells you whether the stock has been moving too quickly in one direction.',
    reading: (v) => {
      if (v >= 70) return `At ${v.toFixed(1)}, the stock has been rising fast lately. It might be getting ahead of itself and could slow down or pull back soon.`;
      if (v >= 60) return `At ${v.toFixed(1)}, the stock has solid upward momentum. It\'s moving up at a healthy pace without being extreme.`;
      if (v >= 50) return `At ${v.toFixed(1)}, the stock is slightly leaning upward. It\'s above the halfway mark, which is a mildly positive sign.`;
      if (v >= 40) return `At ${v.toFixed(1)}, the stock is slightly leaning downward. It\'s below the halfway mark, suggesting mild selling pressure.`;
      if (v > 30) return `At ${v.toFixed(1)}, selling pressure is building. The stock is getting closer to oversold territory where bounces sometimes happen.`;
      return `At ${v.toFixed(1)}, the stock has dropped a lot recently. Sellers may be running out of steam, and a bounce could happen — but it\'s not guaranteed.`;
    },
    howTo: 'Above 70 usually means the stock went up too fast and might pull back. Below 30 means it dropped a lot and could bounce. The 40-60 range is pretty normal — neither extreme. RSI works best combined with other indicators.',
  },

  stochastic: {
    what: 'The Stochastic oscillator shows where the current price sits within its recent high-low range. If a stock traded between $90 and $100 recently and is now at $97, the stochastic would be high (near 70), meaning price is near the top of its range.',
    reading: (v) => {
      if (v >= 80) return `At ${v.toFixed(1)}, the price is very close to its recent high. It\'s been on a strong run but might be running out of room to go higher in the short term.`;
      if (v >= 50) return `At ${v.toFixed(1)}, the price is in the upper half of its recent range. This is a mildly bullish position.`;
      if (v > 20) return `At ${v.toFixed(1)}, the price is in the lower half of its recent range. Sellers have been pushing it down from its recent highs.`;
      return `At ${v.toFixed(1)}, the price is very close to its recent low. It\'s been beaten down and could be due for a bounce.`;
    },
    howTo: 'Above 80 = overbought (price near its high, may pull back). Below 20 = oversold (price near its low, may bounce). When the fast line (%K) crosses above the slow line (%D), that\'s a buy signal. The opposite is a sell signal.',
  },

  williamsR: {
    what: 'Williams %R is similar to the Stochastic — it measures where the current price sits relative to its recent range. The scale runs from -100 (at the bottom) to 0 (at the top). It\'s essentially the inverse of Stochastic.',
    reading: (v) => {
      if (v >= -20) return `At ${v.toFixed(1)}, the price is near the top of its 14-day range. The stock has been strong but could be overextended.`;
      if (v >= -50) return `At ${v.toFixed(1)}, the price is in the upper-middle area. Slightly bearish lean but nothing extreme.`;
      if (v > -80) return `At ${v.toFixed(1)}, the price is in the lower-middle area. Slightly bullish lean as there\'s room for recovery.`;
      return `At ${v.toFixed(1)}, the price is near the bottom of its 14-day range. The stock has been weak and could be due for a bounce.`;
    },
    howTo: 'Above -20 = overbought (stock might pull back). Below -80 = oversold (stock might bounce). It reads the same situations as Stochastic but with a different scale. Best used to confirm signals from other indicators.',
  },

  cci: {
    what: 'CCI (Commodity Channel Index) measures how far the current price is from its recent average. When CCI is high, the price is unusually far above average. When low, it\'s unusually far below. Think of it as measuring how "abnormal" the price is right now.',
    reading: (v) => {
      if (v > 200) return `At ${v.toFixed(0)}, the price is extremely far above its average. This is rare and often unsustainable — expect some mean reversion.`;
      if (v > 100) return `At ${v.toFixed(0)}, the price is well above its 20-day average. Strong bullish momentum but entering overbought territory.`;
      if (v >= 0) return `At ${v.toFixed(0)}, the price is slightly above its average. Mildly bullish — nothing extreme in either direction.`;
      if (v > -100) return `At ${v.toFixed(0)}, the price is slightly below its average. Mildly bearish — a small dip from normal levels.`;
      if (v > -200) return `At ${v.toFixed(0)}, the price is well below its average. Oversold conditions — the stock may be undervalued short-term.`;
      return `At ${v.toFixed(0)}, the price is extremely far below average. This extreme reading often precedes a bounce, but wait for confirmation.`;
    },
    howTo: 'Above +100 = overbought (price may be too high). Below -100 = oversold (price may be too low). Between -100 and +100 is normal territory. CCI can go much higher or lower than 100, unlike RSI which maxes at 100.',
  },

  mfi: {
    what: 'MFI (Money Flow Index) is like RSI but also considers trading volume — how many shares are being traded. It tells you whether big money is flowing into the stock (buying) or out of it (selling). This makes it more reliable than RSI alone.',
    reading: (v) => {
      if (v >= 80) return `At ${v.toFixed(1)}, heavy buying volume is pushing money into the stock. This extreme level suggests the buying spree might slow down soon.`;
      if (v >= 60) return `At ${v.toFixed(1)}, more money is flowing in than out. Healthy buying pressure confirmed by volume — a positive sign.`;
      if (v >= 40) return `At ${v.toFixed(1)}, money flow is balanced. Buyers and sellers are roughly equal — the market is undecided.`;
      if (v > 20) return `At ${v.toFixed(1)}, more money is flowing out. Selling pressure confirmed by volume — a negative sign.`;
      return `At ${v.toFixed(1)}, extreme selling volume has been pushing money out. Sellers may be exhausted — a turnaround could be near.`;
    },
    howTo: 'Above 80 = too much buying (may pull back). Below 20 = too much selling (may bounce). Unlike regular RSI, MFI accounts for volume, so it\'s better at detecting institutional buying/selling. When MFI and price disagree, trust MFI.',
  },

  stochRsi: {
    what: 'Stochastic RSI applies the Stochastic formula to RSI values instead of price. It\'s essentially "momentum of momentum" — it tells you whether the RSI itself is at the high or low end of its recent range. It\'s more sensitive than regular Stochastic or RSI alone.',
    reading: (v) => {
      if (v >= 80) return `At ${v.toFixed(1)}, momentum is at the high end of its range. Both price and momentum are stretched — a pullback is more likely from here.`;
      if (v >= 50) return `At ${v.toFixed(1)}, momentum is in the upper half of its range. Mildly bullish — there\'s room for it to extend further.`;
      if (v > 20) return `At ${v.toFixed(1)}, momentum is in the lower half of its range. Mildly bearish — selling pressure has been building.`;
      return `At ${v.toFixed(1)}, momentum is at its lowest levels. This extreme oversold reading is a strong signal that a bounce may be coming.`;
    },
    howTo: 'Above 80 = overbought momentum. Below 20 = oversold momentum. Stochastic RSI is very sensitive and moves quickly between extremes. Best for timing entries — look for it to cross above 20 for buy signals or below 80 for sell signals.',
  },

  macd: {
    what: 'MACD (Moving Average Convergence Divergence) tracks the relationship between two moving averages of the stock\'s price. When the faster average pulls away from the slower one, it means momentum is building. Think of it like two runners — when the fast one pulls ahead, the stock has momentum.',
    reading: (v) => {
      if (v > 0) return `The MACD line is positive, meaning the fast moving average is above the slow one. Upward momentum is present.`;
      return `The MACD line is negative, meaning the fast moving average is below the slow one. Downward momentum is present.`;
    },
    howTo: 'When the MACD line crosses above the signal line, that\'s a "buy signal." When it crosses below, that\'s a "sell signal." The histogram bars show how far apart the two lines are — growing bars mean momentum is increasing, shrinking bars mean it\'s fading.',
  },

  adx: {
    what: 'ADX (Average Directional Index) measures how strong a trend is — but not which direction. Think of it like a wind gauge: it tells you if there\'s a strong wind blowing, but not whether it\'s blowing north or south. A high ADX means prices are moving strongly in one direction.',
    reading: (v) => {
      if (v < 20) return `At ${v.toFixed(1)}, there is no clear trend. The stock is moving sideways or without conviction. Trend-following strategies are less effective here.`;
      if (v < 40) return `At ${v.toFixed(1)}, a moderate trend exists. The stock is moving with some conviction in one direction. Check other indicators for which direction.`;
      return `At ${v.toFixed(1)}, a strong trend is in place. The price is moving with high conviction. Trading against this trend is risky.`;
    },
    howTo: 'Below 20 = no trend (sideways market). 20-40 = moderate trend. Above 40 = strong trend. ADX doesn\'t tell you the direction — combine it with PSAR, MACD, or moving averages to know if the trend is up or down. High ADX = trust the trend. Low ADX = be cautious with trend signals.',
  },

  psar: {
    what: 'Parabolic SAR places dots above or below the price to show trend direction. When the dots are below the price, the trend is up. When above, the trend is down. The dots also serve as trailing stop-loss levels — a specific price where you might want to exit if the trend reverses.',
    reading: (v) => `The SAR level is at $${v.toFixed(2)}. If price breaks through this level, the trend may be reversing. This level can also be used as a stop-loss point for your position.`,
    howTo: 'Dots below price = uptrend (bullish). Dots above price = downtrend (bearish). When the dots flip from one side to the other, the trend is changing. Use the SAR value as a trailing stop — if price crosses the SAR, consider exiting your position.',
  },

  ema9_21: {
    what: 'EMA 9 and EMA 21 are short-term moving averages that smooth out recent price data. EMA 9 reacts faster to price changes than EMA 21. When the faster one crosses above the slower one, it signals short-term bullish momentum. The opposite signals bearish momentum.',
    reading: (v) => {
      if (v > 2) return `Price is ${v.toFixed(1)}% above the fast EMA. Short-term momentum is clearly bullish with price pulling away from the average.`;
      if (v > 0) return `Price is ${v.toFixed(1)}% above the fast EMA. Slight bullish lean in the very short term.`;
      if (v > -2) return `Price is ${Math.abs(v).toFixed(1)}% below the fast EMA. Slight bearish lean in the very short term.`;
      return `Price is ${Math.abs(v).toFixed(1)}% below the fast EMA. Short-term momentum is clearly bearish.`;
    },
    howTo: 'When EMA 9 crosses above EMA 21, it\'s a short-term buy signal (called a "golden cross" for short-term traders). When EMA 9 crosses below EMA 21, it\'s a sell signal. These signals are fast and good for timing entries, but can give false signals in choppy markets.',
  },

  sma20: {
    what: 'The 20-day SMA (Simple Moving Average) is the average closing price over the last 20 trading days (about one month). It acts as a short-term trend line. When price is above this line, the short-term trend is up. When below, it\'s down.',
    reading: (v) => {
      if (v > 3) return `Price is ${v.toFixed(1)}% above the 20-day average. Short-term trend is bullish — buyers have been in control this month.`;
      if (v > 0) return `Price is ${v.toFixed(1)}% above the 20-day average. Slight bullish lean in the short term.`;
      if (v > -3) return `Price is ${Math.abs(v).toFixed(1)}% below the 20-day average. Slight bearish lean in the short term.`;
      return `Price is ${Math.abs(v).toFixed(1)}% below the 20-day average. Short-term trend is bearish — sellers have dominated this month.`;
    },
    howTo: 'Price above SMA 20 = short-term uptrend. Price below = short-term downtrend. The SMA 20 often acts as a "magnet" — price tends to return to it after moving too far away. Traders use it as a support/resistance level for short-term trades.',
  },

  sma50: {
    what: 'The 50-day SMA averages the closing price over the last 50 trading days (about 2.5 months). It\'s the most-watched medium-term trend indicator. Many professional traders use it to determine whether a stock is in an uptrend or downtrend.',
    reading: (v) => {
      if (v > 5) return `Price is ${v.toFixed(1)}% above the 50-day average. The medium-term trend is clearly bullish — the stock has been consistently moving higher.`;
      if (v > 0) return `Price is ${v.toFixed(1)}% above the 50-day average. The medium-term trend leans bullish.`;
      if (v > -5) return `Price is ${Math.abs(v).toFixed(1)}% below the 50-day average. The medium-term trend leans bearish.`;
      return `Price is ${Math.abs(v).toFixed(1)}% below the 50-day average. The medium-term trend is clearly bearish.`;
    },
    howTo: 'Price above SMA 50 = medium-term uptrend. Price below = medium-term downtrend. The SMA 50 acts as dynamic support in uptrends and resistance in downtrends. When the SMA 50 crosses above the SMA 200, it\'s called a "Golden Cross" — a very bullish signal.',
  },

  sma200: {
    what: 'The 200-day SMA averages closing prices over roughly one year of trading. It\'s the single most important trend indicator used by institutional investors. Being above or below this line is the simplest way to determine if a stock is in a long-term bull or bear market.',
    reading: (v) => {
      if (v > 10) return `Price is ${v.toFixed(1)}% above the 200-day average. The long-term trend is strongly bullish — this stock is in a solid bull market.`;
      if (v > 0) return `Price is ${v.toFixed(1)}% above the 200-day average. The long-term trend is bullish, though not by a wide margin.`;
      if (v > -10) return `Price is ${Math.abs(v).toFixed(1)}% below the 200-day average. The long-term trend is bearish — many funds reduce exposure when price is below this level.`;
      return `Price is ${Math.abs(v).toFixed(1)}% below the 200-day average. The long-term trend is deeply bearish.`;
    },
    howTo: 'Price above SMA 200 = long-term uptrend (bull market). Price below = long-term downtrend (bear market). Many institutional investors won\'t buy stocks trading below their 200-day average. This is the single most important trend line for big-picture analysis.',
  },

  bbPctB: {
    what: 'Bollinger %B tells you where the price is within its Bollinger Bands (a channel that expands and contracts with volatility). 0% means price is at the lower band, 50% means it\'s in the middle, and 100% means it\'s at the upper band. Think of it as how close to the "ceiling" or "floor" the price is.',
    reading: (v) => {
      if (v > 100) return `At ${v.toFixed(0)}%, price has burst above the upper band. This is an extreme move — like a ball bouncing off the ceiling, price often returns to the middle.`;
      if (v > 80) return `At ${v.toFixed(0)}%, price is near the top of the channel. It\'s been rallying and is approaching the upper limit of normal volatility.`;
      if (v > 50) return `At ${v.toFixed(0)}%, price is in the upper half of the band. A mildly bullish position with room before hitting the ceiling.`;
      if (v > 20) return `At ${v.toFixed(0)}%, price is in the lower half of the band. Bearish lean — price is closer to the floor than the ceiling.`;
      if (v >= 0) return `At ${v.toFixed(0)}%, price is near the bottom of the channel. It could bounce from this support level.`;
      return `At ${v.toFixed(0)}%, price has broken below the lower band. This extreme oversold condition often leads to a bounce.`;
    },
    howTo: 'Above 100% or below 0% = extreme (often reverses). 80-100% = near top (overbought). 0-20% = near bottom (oversold). The middle (50%) is neutral. Bollinger Bands work well in range-bound markets. In strong trends, price can "ride the band" for a while.',
  },

  bbWidth: {
    what: 'Bollinger Band Width measures how far apart the upper and lower bands are. When the bands squeeze together (narrow width), it means the stock has been very calm. When they spread wide, the stock has been volatile. A squeeze often comes right before a big price move.',
    reading: (v) => {
      if (v < 3) return `At ${v.toFixed(1)}%, the bands are extremely tight — a "Bollinger Squeeze." The stock has been unusually calm. A big breakout move could be coming, but the direction is unknown.`;
      if (v < 6) return `At ${v.toFixed(1)}%, the bands are relatively narrow. Volatility is low — the stock has been trading in a tight range.`;
      if (v < 12) return `At ${v.toFixed(1)}%, the bands have normal width. Volatility is average for this stock.`;
      return `At ${v.toFixed(1)}%, the bands are wide. The stock has been making large moves recently — high volatility environment.`;
    },
    howTo: 'Very narrow width (<3%) = "Squeeze" (calm before a storm — expect a big move soon). Narrow (3-6%) = low volatility. Normal (6-12%) = typical. Wide (>12%) = high volatility. A squeeze doesn\'t tell you which direction the breakout will go — use other indicators for that.',
  },

  atr: {
    what: 'ATR (Average True Range) measures the average size of daily price swings in dollar terms. If a stock has an ATR of $5, that means it typically moves about $5 per day from its high to its low. It\'s like measuring how "jumpy" a stock is.',
    reading: (v) => `At $${v.toFixed(2)}, the stock typically swings about this much per day. You can expect the price to move roughly +-$${(v / 2).toFixed(2)} from any given opening price on a normal day.`,
    howTo: 'ATR doesn\'t tell you direction — just how much the stock moves. Use it for setting stop-losses: a wider ATR needs a wider stop. If ATR is $5, placing a stop-loss $2 away will likely get triggered by normal daily movement. Use at least 1-2x ATR for stop-loss distance.',
  },

  roc10: {
    what: 'Rate of Change (10-day) shows the percentage price change over the last 10 trading days (about two weeks). Positive = price went up. Negative = price went down. It\'s a straightforward momentum reading — how much did the stock move recently?',
    reading: (v) => {
      if (v > 5) return `Up ${v.toFixed(1)}% in 10 days — strong short-term momentum. Buyers have been very active over the past two weeks.`;
      if (v > 0) return `Up ${v.toFixed(1)}% in 10 days — mild positive momentum over the past two weeks.`;
      if (v > -5) return `Down ${Math.abs(v).toFixed(1)}% in 10 days — mild negative momentum over the past two weeks.`;
      return `Down ${Math.abs(v).toFixed(1)}% in 10 days — significant selling pressure over the past two weeks.`;
    },
    howTo: 'Positive ROC = price is higher than 10 days ago (bullish). Negative = lower (bearish). Very large positive values might mean the stock is overextended and due for a pause. Very large negative values might mean it\'s oversold. Compare to the stock\'s normal ROC range.',
  },

  roc20: {
    what: 'Rate of Change (20-day) shows the percentage price change over the last 20 trading days (about one month). It gives a slightly longer-term view of momentum than the 10-day version. Positive = the stock is higher than a month ago.',
    reading: (v) => {
      if (v > 10) return `Up ${v.toFixed(1)}% in 20 days — very strong one-month momentum. The stock has been rallying aggressively.`;
      if (v > 0) return `Up ${v.toFixed(1)}% in 20 days — the stock has been trending higher over the past month.`;
      if (v > -10) return `Down ${Math.abs(v).toFixed(1)}% in 20 days — the stock has been declining over the past month.`;
      return `Down ${Math.abs(v).toFixed(1)}% in 20 days — significant decline. A full month of selling pressure.`;
    },
    howTo: 'Positive = bullish one-month trend. Negative = bearish. When both 10-day and 20-day ROC are positive and increasing, momentum is accelerating (very bullish). When both are negative and declining, the selling is accelerating (very bearish).',
  },

  obv: {
    what: 'OBV (On Balance Volume) tracks whether volume is flowing into or out of a stock. On days when price goes up, the day\'s volume is added. On down days, it\'s subtracted. The direction of OBV tells you whether "smart money" is buying or selling.',
    reading: () => 'OBV direction shows whether more volume has been occurring on up-days versus down-days. Rising OBV means money is flowing in; falling means it\'s flowing out.',
    howTo: 'Rising OBV + rising price = confirmed uptrend (strong). Falling OBV + falling price = confirmed downtrend (strong). Rising OBV + falling price = "accumulation" (smart money buying — bullish divergence). Falling OBV + rising price = "distribution" (smart money selling — bearish divergence).',
  },

  volRatio: {
    what: 'Volume Ratio compares today\'s trading volume to the average volume over the last 20 days. A ratio of 1.0x means volume is exactly average. Higher means more people are trading the stock today than usual, which often signals something important is happening.',
    reading: (v) => {
      if (v > 2) return `At ${v.toFixed(1)}x average, trading volume is unusually high. Something significant is likely driving this activity — news, earnings, or institutional activity.`;
      if (v > 1.3) return `At ${v.toFixed(1)}x average, volume is above normal. Price moves on above-average volume tend to be more meaningful and sustainable.`;
      if (v >= 0.7) return `At ${v.toFixed(1)}x average, volume is in the normal range. Nothing unusual about the level of trading activity.`;
      return `At ${v.toFixed(1)}x average, volume is below normal. Price moves on low volume are less reliable — there may not be strong conviction behind the move.`;
    },
    howTo: 'Above 2x = very high (something important is happening). 1.3-2x = elevated (increased interest). 0.7-1.3x = normal. Below 0.7x = low (thin trading). Price moves on high volume are more trustworthy. Price moves on low volume can reverse easily.',
  },

  pos52w: {
    what: '52-Week Position shows where the current price sits between its lowest and highest points over the past year. 0% means the stock is at its yearly low, 100% means it\'s at its yearly high, and 50% means it\'s right in the middle.',
    reading: (v) => {
      if (v >= 90) return `At ${v.toFixed(0)}% of its yearly range, the stock is near its 52-week high. Stocks near their highs tend to keep going higher (momentum effect), but the upside gets riskier.`;
      if (v >= 60) return `At ${v.toFixed(0)}%, the stock is in the upper portion of its yearly range. A healthy position for a stock in an uptrend.`;
      if (v >= 40) return `At ${v.toFixed(0)}%, the stock is near the middle of its yearly range. Neither particularly strong nor weak.`;
      if (v >= 10) return `At ${v.toFixed(0)}%, the stock is in the lower portion of its yearly range. It\'s closer to its yearly low, which could mean value opportunity or continued weakness.`;
      return `At ${v.toFixed(0)}%, the stock is near its 52-week low. This could be a deep value opportunity or a sign of serious problems — research is important here.`;
    },
    howTo: 'Near 100% = at yearly highs (momentum, but expensive). Near 50% = middle of range (neutral). Near 0% = at yearly lows (potential value, but could also mean the stock has problems). Stocks making new 52-week highs tend to outperform, but stocks near 52-week lows can be value traps.',
  },
};

export function getHoverDescription(key: string): HoverDescription {
  return descriptions[key] ?? {
    what: 'A technical analysis indicator that helps assess the stock\'s price behavior.',
    reading: () => 'This reading provides insight into the current market conditions for this stock.',
    howTo: 'Use this indicator alongside others for a more complete picture. No single indicator is reliable on its own.',
  };
}
