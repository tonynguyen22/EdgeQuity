import type { DDMInputs, DDMResult } from './types';

/**
 * Gordon Growth Model (single-stage): P = D1 / (ke - g)
 */
function gordonGrowth(d0: number, g: number, ke: number): { value: number; d1: number } {
  const d1 = d0 * (1 + g);
  if (ke <= g) return { value: 0, d1 };
  return { value: d1 / (ke - g), d1 };
}

/**
 * H-Model (2-stage with linear decline):
 * P = D0(1+gL) / (ke - gL) + D0 * H * (gS - gL) / (ke - gL)
 * where H = highGrowthYears / 2
 */
function hModel(d0: number, gS: number, gL: number, ke: number, years: number): number {
  if (ke <= gL) return 0;
  const term1 = d0 * (1 + gL) / (ke - gL);
  const H = years / 2;
  const term2 = (d0 * H * (gS - gL)) / (ke - gL);
  return term1 + term2;
}

export function computeDDM(inputs: DDMInputs, currentPrice: number): DDMResult {
  const {
    currentDividend, shortTermGrowth, terminalGrowth,
    costOfEquity, highGrowthYears, modelType,
  } = inputs;

  const d0 = currentDividend;
  const gS = shortTermGrowth / 100;
  const gL = terminalGrowth / 100;
  const ke = costOfEquity / 100;

  let intrinsicValue = 0;
  let terminalValue = 0;
  let pvTerminalValue = 0;
  let pvDividends = 0;
  const dividendStream: { year: string; dividend: number; pv: number }[] = [];
  let modelLabel = '';

  if (modelType === 'gordon') {
    modelLabel = 'Gordon Growth Model';
    const { value, d1 } = gordonGrowth(d0, gL, ke);
    intrinsicValue = value;
    terminalValue = value;
    pvTerminalValue = value;
    pvDividends = 0;
    dividendStream.push({
      year: 'D1 (perpetuity)',
      dividend: d1,
      pv: value,
    });
  } else if (modelType === 'hmodel') {
    modelLabel = 'H-Model (2-Stage)';
    intrinsicValue = hModel(d0, gS, gL, ke, highGrowthYears);
    // Build illustrative dividend stream
    let div = d0;
    for (let i = 1; i <= highGrowthYears + 5; i++) {
      const t = i;
      const growthRate = i <= highGrowthYears
        ? gS - (gS - gL) * (i / highGrowthYears)
        : gL;
      div = div * (1 + growthRate);
      const pv = div / Math.pow(1 + ke, t);
      dividendStream.push({
        year: `Year ${i}`,
        dividend: div,
        pv,
      });
      if (i <= highGrowthYears) pvDividends += pv;
    }
    pvTerminalValue = intrinsicValue - pvDividends;
    terminalValue = pvTerminalValue * Math.pow(1 + ke, highGrowthYears);
  } else {
    // Multi-stage: explicit forecast + terminal
    modelLabel = 'Multi-Stage DDM';
    let div = d0;
    let sumPvDiv = 0;

    for (let i = 1; i <= highGrowthYears; i++) {
      div = div * (1 + gS);
      const pv = div / Math.pow(1 + ke, i);
      sumPvDiv += pv;
      dividendStream.push({
        year: `Year ${i}`,
        dividend: div,
        pv,
      });
    }

    // Terminal value at end of high-growth period
    const termDiv = div * (1 + gL);
    if (ke > gL) {
      terminalValue = termDiv / (ke - gL);
      pvTerminalValue = terminalValue / Math.pow(1 + ke, highGrowthYears);
    }

    pvDividends = sumPvDiv;
    intrinsicValue = pvDividends + pvTerminalValue;

    // Show a few terminal period dividends for illustration
    let postDiv = div;
    for (let i = 1; i <= 3; i++) {
      postDiv = postDiv * (1 + gL);
      dividendStream.push({
        year: `Year ${highGrowthYears + i} (terminal)`,
        dividend: postDiv,
        pv: postDiv / Math.pow(1 + ke, highGrowthYears + i),
      });
    }
  }

  const upside = currentPrice > 0 ? (intrinsicValue - currentPrice) / currentPrice : 0;
  const impliedYield = intrinsicValue > 0 ? (d0 * (1 + gL)) / intrinsicValue : 0;

  return {
    intrinsicValue,
    currentPrice,
    upside,
    impliedYield,
    dividendStream,
    terminalValue,
    pvTerminalValue,
    pvDividends,
    modelLabel,
  };
}

export function computeDDMSensitivity(
  inputs: DDMInputs,
  currentPrice: number,
  growthSteps: number[],
  coeSteps: number[],
): (number | null)[][] {
  return growthSteps.map(g =>
    coeSteps.map(coe => {
      const modInputs = { ...inputs, terminalGrowth: g * 100, costOfEquity: coe * 100 };
      try {
        const result = computeDDM(modInputs, currentPrice);
        return result.intrinsicValue > 0 && result.intrinsicValue < 100000 ? result.intrinsicValue : null;
      } catch {
        return null;
      }
    })
  );
}
