const ROUND_BAR_SIZES = [
  0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5, 1.75, 2,
  2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 8, 9, 10, 12,
];

function nextStandardRoundBar(diameter: number): number {
  return ROUND_BAR_SIZES.find((s) => s >= diameter) ?? diameter;
}

function roundUpToEighth(value: number): number {
  return Math.ceil(value * 8) / 8;
}

function roundUpToHalf(value: number): number {
  return Math.ceil(value * 2) / 2;
}

function isCylindrical(x: number, y: number, z: number): boolean {
  const dims = [x, y, z].sort((a, b) => a - b);
  // Check if the two largest dimensions are equal (circular cross section)
  const ratio = dims[1] / dims[2];
  return ratio >= 0.9;
}

function isSquare(x: number, y: number): boolean {
  if (x === 0 || y === 0) return false;
  const ratio = Math.min(x, y) / Math.max(x, y);
  return ratio >= 0.95; // within 5%
}

export type StockSuggestion = {
  type: "ROUND_BAR" | "TUBE" | "PLATE" | "SQUARE_BAR" | "UNKNOWN";
  label: string;
  details: {
    diameter?: number;
    length?: number;
    width?: number;
    height?: number;
    thickness?: number;
    side?: number;
  };
};

export function suggestStock(
  boundingX: number,
  boundingY: number,
  boundingZ: number,
  stockType: string = "AUTO",
): StockSuggestion | null {
  if (!boundingX || !boundingY || !boundingZ) return null;

  const FACE_ALLOWANCE = 0.25; // 1/8" per end
  const OD_ALLOWANCE = 0.125;
  const PLATE_ALLOWANCE = 0.25;

  // Manual overrides
  if (stockType === "TUBE") {
    const od = roundUpToEighth(Math.max(boundingX, boundingY) + OD_ALLOWANCE);
    const length = roundUpToHalf(boundingZ + FACE_ALLOWANCE);
    return {
      type: "TUBE",
      label: `${od}" OD Tube × ${length}" Long`,
      details: { diameter: od, length },
    };
  }

  if (stockType === "PLATE") {
    const width = roundUpToEighth(boundingX + PLATE_ALLOWANCE);
    const height = roundUpToEighth(boundingY + PLATE_ALLOWANCE);
    const thickness = roundUpToEighth(boundingZ + OD_ALLOWANCE);
    return {
      type: "PLATE",
      label: `${width}" × ${height}" × ${thickness}" Plate`,
      details: { width, height, thickness },
    };
  }

  if (stockType === "SQUARE_BAR") {
    const side = roundUpToEighth(Math.max(boundingX, boundingY) + OD_ALLOWANCE);
    const length = roundUpToHalf(boundingZ + FACE_ALLOWANCE);
    return {
      type: "SQUARE_BAR",
      label: `${side}" Square Bar × ${length}" Long`,
      details: { side, length },
    };
  }

  if (stockType === "ROUND_BAR") {
    const neededOD = Math.max(boundingX, boundingY) + OD_ALLOWANCE;
    const diameter = nextStandardRoundBar(neededOD);
    const length = roundUpToHalf(boundingZ + FACE_ALLOWANCE);
    return {
      type: "ROUND_BAR",
      label: `${diameter}" Ø Round Bar × ${length}" Long`,
      details: { diameter, length },
    };
  }

  // AUTO detection
  if (isCylindrical(boundingX, boundingY, boundingZ)) {
    const diameter = Math.max(boundingX, boundingY, boundingZ);
    const thickness = Math.min(boundingX, boundingY, boundingZ);
    const neededOD = diameter + OD_ALLOWANCE;
    const standardOD = nextStandardRoundBar(neededOD);
    const length = roundUpToHalf(thickness + FACE_ALLOWANCE);
    return {
      type: "ROUND_BAR",
      label: `${standardOD}" Ø Round Bar × ${length}" Long`,
      details: { diameter: standardOD, length },
    };
  }

  if (isSquare(boundingX, boundingY) && Math.max(boundingX, boundingY) < 3) {
    const side = roundUpToEighth(Math.max(boundingX, boundingY) + OD_ALLOWANCE);
    const length = roundUpToHalf(boundingZ + FACE_ALLOWANCE);
    return {
      type: "SQUARE_BAR",
      label: `${side}" Square Bar × ${length}" Long`,
      details: { side, length },
    };
  }

  // Default to plate
  const width = roundUpToEighth(boundingX + PLATE_ALLOWANCE);
  const height = roundUpToEighth(boundingY + PLATE_ALLOWANCE);
  const thickness = roundUpToEighth(boundingZ + OD_ALLOWANCE);
  return {
    type: "PLATE",
    label: `${width}" × ${height}" × ${thickness}" Plate`,
    details: { width, height, thickness },
  };
}
