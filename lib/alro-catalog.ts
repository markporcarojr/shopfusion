// lib/alro-catalog.ts
// Data extracted from Alro Metals Guide
// Source: Alro Steel Metals Guide Catalog
// Note: Weights are in lbs/ft. Sizes are in inches.

export type StockSize = {
  size: string;       // e.g. "1-1/4"
  decimal: number;    // e.g. 1.25
  lbsPerFt: number;   // e.g. 5.31
};

// Convert fraction string to decimal
export function fractionToDecimal(s: string): number {
  const parts = s.split("-");
  if (parts.length === 2) {
    const whole = parseInt(parts[0]);
    const frac = parts[1];
    if (frac.includes("/")) {
      const [num, den] = frac.split("/");
      return whole + parseInt(num) / parseInt(den);
    }
    return whole + parseFloat(frac);
  }
  if (s.includes("/")) {
    const [num, den] = s.split("/");
    return parseInt(num) / parseInt(den);
  }
  return parseFloat(s);
}

// Steel Cold Finished Round Bar (lbs/ft)
const STEEL_ROUND_RAW: Record<string, number> = {
  "1/8": 0.05, "3/16": 0.12, "1/4": 0.21, "5/16": 0.33,
  "3/8": 0.478, "7/16": 0.65, "1/2": 0.85, "9/16": 1.08,
  "5/8": 1.328, "11/16": 1.61, "3/4": 1.91, "13/16": 2.24,
  "7/8": 2.6, "15/16": 2.99, "1": 3.4, "1-1/16": 3.84,
  "1-1/8": 4.3, "1-3/16": 4.8, "1-1/4": 5.31, "1-5/16": 5.86,
  "1-3/8": 6.43, "1-7/16": 7.03, "1-1/2": 7.65, "1-5/8": 8.98,
  "1-3/4": 10.413, "1-7/8": 11.95, "2": 13.6, "2-1/8": 15.35,
  "2-1/4": 17.22, "2-3/8": 19.18, "2-1/2": 21.26, "2-5/8": 23.43,
  "2-3/4": 25.71, "2-7/8": 22.07, "3": 30.6, "3-1/4": 35.91,
  "3-1/2": 41.65, "3-3/4": 47.81, "4": 54.4, "4-1/2": 68.85,
  "5": 85.04, "5-1/2": 102.8, "6": 122.4, "6-1/2": 112.82,
  "7": 130.84, "7-1/2": 150.21, "8": 170.9, "8-1/2": 192.93,
  "9": 216.3, "9-1/2": 241.0, "10": 266.87, "11": 332.29,
  "12": 394.54, "14": 535.05, "16": 696.91, "18": 880.14,
  "20": 1084.73,
};

// 6061-T6 Aluminum Round Bar (lbs/ft)
const ALUM_6061_ROUND_RAW: Record<string, number> = {
  "1/8": 0.014, "3/16": 0.032, "1/4": 0.075, "5/16": 0.09,
  "3/8": 0.169, "7/16": 0.23, "1/2": 0.3, "9/16": 0.379,
  "5/8": 0.3716, "11/16": 0.4497, "3/4": 0.5352, "13/16": 0.6281,
  "7/8": 0.7284, "1": 0.868, "1-1/8": 1.099, "1-1/4": 1.355,
  "1-3/8": 1.638, "1-1/2": 1.946, "1-5/8": 2.280, "1-3/4": 2.640,
  "2": 3.443, "2-1/4": 4.357, "2-1/2": 5.374, "2-3/4": 6.497,
  "3": 7.725, "3-1/2": 10.51, "4": 13.73, "4-1/2": 17.38,
  "5": 21.46, "6": 30.88,
};

// Steel Cold Finished Square Bar (lbs/ft)
const STEEL_SQUARE_RAW: Record<string, number> = {
  "1/8": 0.053, "3/16": 0.12, "1/4": 0.213, "5/16": 0.332,
  "3/8": 0.478, "7/16": 0.651, "1/2": 0.850, "9/16": 1.076,
  "5/8": 1.328, "11/16": 1.608, "3/4": 1.913, "7/8": 2.603,
  "1": 3.400, "1-1/8": 4.303, "1-1/4": 5.313, "1-3/8": 6.428,
  "1-1/2": 7.650, "1-5/8": 8.978, "1-3/4": 10.413, "2": 13.600,
  "2-1/4": 17.213, "2-1/2": 21.250, "3": 30.600, "3-1/2": 41.650,
  "4": 54.400, "5": 85.000, "6": 122.400,
};

function buildSizes(raw: Record<string, number>): StockSize[] {
  return Object.entries(raw)
    .map(([size, lbsPerFt]) => ({
      size,
      decimal: fractionToDecimal(size),
      lbsPerFt,
    }))
    .sort((a, b) => a.decimal - b.decimal);
}

export const ALRO_CATALOG = {
  steelRoundBar: buildSizes(STEEL_ROUND_RAW),
  alum6061RoundBar: buildSizes(ALUM_6061_ROUND_RAW),
  steelSquareBar: buildSizes(STEEL_SQUARE_RAW),
};

// Get next standard size at or above the required diameter
export function nextStandardSize(
  sizes: StockSize[],
  requiredDecimal: number
): StockSize | null {
  return sizes.find((s) => s.decimal >= requiredDecimal) ?? null;
}

// Get lbs/ft for a specific size
export function getLbsPerFt(
  sizes: StockSize[],
  sizeDecimal: number
): number | null {
  const match = sizes.find((s) => Math.abs(s.decimal - sizeDecimal) < 0.001);
  return match?.lbsPerFt ?? null;
}

// Get all available sizes as decimal array (for dropdown)
export function getSizeList(sizes: StockSize[]): string[] {
  return sizes.map((s) => s.size);
}
