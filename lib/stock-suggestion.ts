import {
  ALRO_CATALOG,
  nextStandardSize,
  fractionToDecimal,
  type StockSize,
} from "./alro-catalog";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function roundUpToEighth(value: number): number {
  return Math.ceil(value * 8) / 8;
}

function roundUpToHalf(value: number): number {
  return Math.ceil(value * 2) / 2;
}

function isCylindrical(x: number, y: number, z: number): boolean {
  const dims = [x, y, z].sort((a, b) => a - b);
  if (dims[2] === 0) return false;
  return dims[1] / dims[2] >= 0.9;
}

function isSquare(x: number, y: number, z: number): boolean {
  const dims = [x, y, z].sort((a, b) => a - b);
  if (dims[2] === 0) return false;
  return dims[1] / dims[2] >= 0.95 && dims[0] / dims[2] < 0.5;
}

function getMaterialCatalog(material: string | null): StockSize[] {
  if (!material) return ALRO_CATALOG.steelRoundBar;
  const m = material.toLowerCase();
  if (m.includes("alum") || m.includes("6061") || m.includes("7075") || m.includes("2024")) {
    return ALRO_CATALOG.alum6061RoundBar;
  }
  return ALRO_CATALOG.steelRoundBar;
}

function calcStockWeight(lbsPerFt: number, lengthInches: number): number {
  return Math.round(lbsPerFt * (lengthInches / 12) * 100) / 100;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type StockSuggestion = {
  type: "ROUND_BAR" | "TUBE" | "PLATE" | "SQUARE_BAR" | "UNKNOWN";
  label: string;
  weightLbs: number | null;
  details: {
    diameter?: string;
    length?: number;
    width?: number;
    height?: number;
    thickness?: number;
    side?: string;
  };
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function suggestStock(
  boundingX: number,
  boundingY: number,
  boundingZ: number,
  stockType: string = "AUTO",
  material: string | null = null
): StockSuggestion | null {
  if (!boundingX || !boundingY || !boundingZ) return null;

  const FACE_ALLOWANCE = 0.25;
  const OD_ALLOWANCE = 0.125;
  const PLATE_ALLOWANCE = 0.25;

  const roundCatalog = getMaterialCatalog(material);
  const squareCatalog = ALRO_CATALOG.steelSquareBar;

  // ── TUBE ──
  if (stockType === "TUBE") {
    const diameter = Math.max(boundingX, boundingY, boundingZ);
    const length = roundUpToHalf(Math.min(boundingX, boundingY, boundingZ) + FACE_ALLOWANCE);
    const od = roundUpToEighth(diameter + OD_ALLOWANCE);
    return {
      type: "TUBE",
      label: `${od}" OD Tube × ${length}" Long`,
      weightLbs: null,
      details: { diameter: `${od}`, length },
    };
  }

  // ── PLATE ──
  if (stockType === "PLATE") {
    const dims = [boundingX, boundingY, boundingZ].sort((a, b) => b - a);
    const width = roundUpToEighth(dims[0] + PLATE_ALLOWANCE);
    const height = roundUpToEighth(dims[1] + PLATE_ALLOWANCE);
    const thickness = roundUpToEighth(dims[2] + OD_ALLOWANCE);
    return {
      type: "PLATE",
      label: `${width}" × ${height}" × ${thickness}" Plate`,
      weightLbs: null,
      details: { width, height, thickness },
    };
  }

  // ── SQUARE BAR ──
  if (stockType === "SQUARE_BAR") {
    const dims = [boundingX, boundingY, boundingZ].sort((a, b) => b - a);
    const neededSide = dims[0] + OD_ALLOWANCE;
    const match = nextStandardSize(squareCatalog, neededSide);
    const length = roundUpToHalf(dims[2] + FACE_ALLOWANCE);
    const weight = match ? calcStockWeight(match.lbsPerFt, length) : null;
    const sideLabel = match ? match.size : `${roundUpToEighth(neededSide)}"`;
    return {
      type: "SQUARE_BAR",
      label: `${sideLabel}" Square Bar × ${length}" Long`,
      weightLbs: weight,
      details: { side: sideLabel, length },
    };
  }

  // ── ROUND BAR (manual) ──
  if (stockType === "ROUND_BAR") {
    const dims = [boundingX, boundingY, boundingZ].sort((a, b) => b - a);
    const neededOD = dims[0] + OD_ALLOWANCE;
    const match = nextStandardSize(roundCatalog, neededOD);
    const length = roundUpToHalf(dims[2] + FACE_ALLOWANCE);
    const weight = match ? calcStockWeight(match.lbsPerFt, length) : null;
    const diamLabel = match ? match.size : `${roundUpToEighth(neededOD)}"`;
    return {
      type: "ROUND_BAR",
      label: `${diamLabel}" Ø Round Bar × ${length}" Long`,
      weightLbs: weight,
      details: { diameter: diamLabel, length },
    };
  }

  // ── AUTO DETECT ──
  if (isCylindrical(boundingX, boundingY, boundingZ)) {
    const dims = [boundingX, boundingY, boundingZ].sort((a, b) => b - a);
    const neededOD = dims[0] + OD_ALLOWANCE;
    const match = nextStandardSize(roundCatalog, neededOD);
    const length = roundUpToHalf(dims[2] + FACE_ALLOWANCE);
    const weight = match ? calcStockWeight(match.lbsPerFt, length) : null;
    const diamLabel = match ? match.size : `${roundUpToEighth(neededOD)}"`;
    return {
      type: "ROUND_BAR",
      label: `${diamLabel}" Ø Round Bar × ${length}" Long`,
      weightLbs: weight,
      details: { diameter: diamLabel, length },
    };
  }

  if (isSquare(boundingX, boundingY, boundingZ)) {
    const dims = [boundingX, boundingY, boundingZ].sort((a, b) => b - a);
    const neededSide = dims[0] + OD_ALLOWANCE;
    const match = nextStandardSize(squareCatalog, neededSide);
    const length = roundUpToHalf(dims[2] + FACE_ALLOWANCE);
    const weight = match ? calcStockWeight(match.lbsPerFt, length) : null;
    const sideLabel = match ? match.size : `${roundUpToEighth(neededSide)}"`;
    return {
      type: "SQUARE_BAR",
      label: `${sideLabel}" Square Bar × ${length}" Long`,
      weightLbs: weight,
      details: { side: sideLabel, length },
    };
  }

  // Default to plate
  const dims = [boundingX, boundingY, boundingZ].sort((a, b) => b - a);
  const width = roundUpToEighth(dims[0] + PLATE_ALLOWANCE);
  const height = roundUpToEighth(dims[1] + PLATE_ALLOWANCE);
  const thickness = roundUpToEighth(dims[2] + OD_ALLOWANCE);
  return {
    type: "PLATE",
    label: `${width}" × ${height}" × ${thickness}" Plate`,
    weightLbs: null,
    details: { width, height, thickness },
  };
}