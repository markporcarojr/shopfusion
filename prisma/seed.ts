import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Seeded jobs use job numbers in this range so they're easy to identify/remove.
const SEED_JOB_START = 90000;
const STEEL_DENSITY = 0.2836; // lb/in³
const ALUM_DENSITY = 0.0975; // lb/in³
// ──────────────────────────────────────────────────────────────────────────────

type PartSpec = {
  name: string;
  /** cylinder: [diameter, length] · disc: [diameter, thickness] · plate: [x,y,z] */
  shape: "CYLINDER" | "DISC" | "PLATE";
  dims: [number, number] | [number, number, number];
  /** Through-bore diameter, if the part is hollow. Drives volume and mass. */
  bore?: number;
  material: string;
  stockType: string;
  operations: string;
  notes?: string;
};

/** Part families modeled on the real shop data. */
const PART_LIBRARY: PartSpec[] = [
  {
    name: '4" ROLLER',
    shape: "CYLINDER",
    dims: [4.25, 2.5],
    bore: 2.75,
    material: "1045 Steel",
    stockType: "ROUND_BAR",
    operations: "Face both ends, turn OD, bore ID, press bearings",
  },
  {
    name: '5" ROLLER',
    shape: "CYLINDER",
    dims: [5.4, 2.7892],
    bore: 3.45,
    material: "1045 Steel",
    stockType: "ROUND_BAR",
    operations: "Face both ends, turn OD to 5.400, bore 3.450 ID",
    notes: "Match existing roller on line 3",
  },
  {
    name: "7in ROLLER",
    shape: "CYLINDER",
    dims: [7.1, 3.18],
    bore: 4.5,
    material: "1045 Steel",
    stockType: "ROUND_BAR",
    operations: "Rough turn, finish OD, bore, chamfer both ends",
  },
  {
    name: "Roller Slug 7",
    shape: "CYLINDER",
    dims: [7.1, 3.18],
    bore: 3.5,
    material: "4140 Steel",
    stockType: "ROUND_BAR",
    operations: "Saw blank, face, center drill, rough turn",
  },
  {
    name: "5in Bearing Cover",
    shape: "DISC",
    dims: [5.123, 0.25],
    bore: 4.751,
    material: "1018 Steel",
    stockType: "PLATE",
    operations: "Face, turn OD, bore center, drill 6 hole pattern on 4.25 BC",
  },
  {
    name: "7in Bearing Cover",
    shape: "DISC",
    dims: [7.125, 0.305],
    bore: 6.5,
    material: "1018 Steel",
    stockType: "PLATE",
    operations: "Face both sides, turn OD, bore center, drill bolt pattern",
    notes: "6 hole pattern on 5.5 BC",
  },
  {
    name: "Retaining Ring",
    shape: "DISC",
    dims: [3.5, 0.1875],
    bore: 3.0,
    material: "303 Stainless Steel",
    stockType: "TUBE",
    operations: "Part off tube, face both sides, deburr",
  },
  {
    name: "Barrel Sleeve",
    shape: "CYLINDER",
    dims: [4.0, 8.5],
    bore: 3.25,
    material: "4140 Steel",
    stockType: "TUBE",
    operations: "Bore ID, hone, turn OD, chamfer",
  },
  {
    name: "Drive Shaft",
    shape: "CYLINDER",
    dims: [1.75, 14.0],
    material: "1045 Steel",
    stockType: "ROUND_BAR",
    operations: "Turn to 1.750 OD, cut keyway, thread one end 1-8 UNC",
  },
  {
    name: "Pivot Pin",
    shape: "CYLINDER",
    dims: [1.25, 6.5],
    material: "4140 Steel",
    stockType: "ROUND_BAR",
    operations: "Turn OD, cross drill, chamfer both ends",
  },
  {
    name: "Spacer Block",
    shape: "PLATE",
    dims: [4.0, 3.0, 1.25],
    material: "6061-T6 Aluminum",
    stockType: "PLATE",
    operations: "Mill to size, drill 4 clearance holes, deburr",
  },
  {
    name: "Adapter Plate",
    shape: "PLATE",
    dims: [6.5, 6.5, 0.75],
    material: "6061-T6 Aluminum",
    stockType: "PLATE",
    operations: "Face both sides, mill profile, drill and tap 8 holes",
  },
  {
    name: "Bushing",
    shape: "CYLINDER",
    dims: [2.25, 1.75],
    bore: 1.75,
    material: "Bronze",
    stockType: "TUBE",
    operations: "Bore ID, turn OD, part off, deburr",
  },
  {
    name: "End Cap",
    shape: "DISC",
    dims: [4.5, 0.5],
    bore: 2.0,
    material: "1018 Steel",
    stockType: "ROUND_BAR",
    operations: "Face, turn OD, bore recess, drill 4 holes",
  },
];

/** Job templates — realistic groupings of the parts above. */
const JOB_TEMPLATES: {
  customer: string;
  description: string;
  status: string;
  hours: number;
  parts: string[];
}[] = [
  {
    customer: "Big Dog Builders",
    description: "Conveyor roller rebuild",
    status: "ACTIVE",
    hours: 14.5,
    parts: ['5" ROLLER', "5in Bearing Cover"],
  },
  {
    customer: "Big Dog Builders",
    description: "Line 3 roller replacement",
    status: "ACTIVE",
    hours: 22.0,
    parts: ["7in ROLLER", "Roller Slug 7", "7in Bearing Cover"],
  },
  {
    customer: "Big Dog Builders",
    description: "Spare roller assemblies - qty 2",
    status: "DONE",
    hours: 18.75,
    parts: ['4" ROLLER', "5in Bearing Cover", "Retaining Ring"],
  },
  {
    customer: "Av Flight",
    description: "New barrel",
    status: "DONE",
    hours: 9.5,
    parts: ["Barrel Sleeve", "End Cap"],
  },
  {
    customer: "Av Flight",
    description: "Shaft repair - broken keyway",
    status: "ACTIVE",
    hours: 6.25,
    parts: ["Drive Shaft"],
  },
  {
    customer: "Great Lakes Mfg",
    description: "Pivot assembly rebuild",
    status: "ACTIVE",
    hours: 11.0,
    parts: ["Pivot Pin", "Bushing", "Retaining Ring"],
  },
  {
    customer: "Great Lakes Mfg",
    description: "Fixture spacers - qty 8",
    status: "DONE",
    hours: 7.5,
    parts: ["Spacer Block"],
  },
  {
    customer: "Motor City Tool",
    description: "Adapter plate for new mount",
    status: "ACTIVE",
    hours: 5.0,
    parts: ["Adapter Plate", "Spacer Block"],
  },
  {
    customer: "Motor City Tool",
    description: "Roller slug blanks",
    status: "PAUSED",
    hours: 3.25,
    parts: ["Roller Slug 7"],
  },
  {
    customer: "Saginaw Steel",
    description: "Bearing cover set",
    status: "DONE",
    hours: 12.0,
    parts: ["7in Bearing Cover", "5in Bearing Cover"],
  },
  {
    customer: "Saginaw Steel",
    description: "Waiting on print revision",
    status: "PAUSED",
    hours: 0,
    parts: [],
  },
  {
    customer: "Oakland Industrial",
    description: "Bushing and pin rebuild kit",
    status: "ACTIVE",
    hours: 16.5,
    parts: ["Bushing", "Pivot Pin", "End Cap"],
  },
];

const TIME_NOTES = [
  "Setup and first article",
  "Production run",
  "Rough turning",
  "Finish pass and inspection",
  "Bore and deburr",
  "Saw stock, face ends",
  "Bolt pattern layout and drill",
  "Final inspection and cleanup",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function density(material: string): number {
  const m = material.toLowerCase();
  if (m.includes("alum") || m.includes("6061") || m.includes("7075")) {
    return ALUM_DENSITY;
  }
  if (m.includes("bronze")) return 0.318;
  return STEEL_DENSITY;
}

/** Returns bounding box, volume, and surface area for a part spec. */
function geometry(spec: PartSpec) {
  if (spec.shape === "PLATE") {
    const [x, y, z] = spec.dims as [number, number, number];
    const volume = x * y * z;
    const area = 2 * (x * y + y * z + x * z);
    return {
      boundingX: round(x),
      boundingY: round(y),
      boundingZ: round(z),
      volume: round(volume),
      surfaceArea: round(area),
    };
  }

  // CYLINDER and DISC are both round stock — [diameter, length/thickness]
  const [dia, len] = spec.dims as [number, number];
  const r = dia / 2;
  const rBore = spec.bore ? spec.bore / 2 : 0;

  // Hollow parts: subtract the bore from volume, add the bore wall to area.
  const volume = Math.PI * (r * r - rBore * rBore) * len;
  const endFaces = 2 * Math.PI * (r * r - rBore * rBore);
  const outerWall = 2 * Math.PI * r * len;
  const innerWall = 2 * Math.PI * rBore * len;
  const area = endFaces + outerWall + innerWall;

  // Match the real data's axis convention: thickness on X, diameter on Y and Z
  return {
    boundingX: round(len),
    boundingY: round(dia),
    boundingZ: round(dia),
    volume: round(volume),
    surfaceArea: round(area),
  };
}

function round(n: number, places = 4): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// ─── SEED ─────────────────────────────────────────────────────────────────────

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found. Sign into the app first to create one.");
    process.exit(1);
  }

  // Reuse a real drawing PDF from the existing data so seeded drawings render.
  const realDrawing = await prisma.fusionLog.findFirst({
    where: { type: "DRAWING", imageData: { not: null } },
    select: { imageData: true },
  });

  if (!realDrawing?.imageData) {
    console.warn(
      "⚠ No existing drawing with a PDF found — seeded drawings will have no preview.",
    );
  }
  const samplePdf = realDrawing?.imageData ?? null;

  // Clear any previous seed run (leaves real jobs untouched).
  const removed = await prisma.job.deleteMany({
    where: { userId: user.id, jobNumber: { gte: SEED_JOB_START } },
  });
  if (removed.count > 0) {
    console.log(`Cleared ${removed.count} previously seeded jobs`);
  }

  const partsByName = new Map(PART_LIBRARY.map((p) => [p.name, p]));

  let jobCount = 0;
  let compCount = 0;
  let logCount = 0;
  let timeCount = 0;

  for (const [i, tpl] of JOB_TEMPLATES.entries()) {
    const createdAt = daysAgo((JOB_TEMPLATES.length - i) * 6);

    const job = await prisma.job.create({
      data: {
        jobNumber: SEED_JOB_START + i + 1,
        customerName: tpl.customer,
        description: tpl.description,
        status: tpl.status,
        hoursWorked: tpl.hours > 0 ? tpl.hours : null,
        userId: user.id,
        createdAt,
        updatedAt: createdAt,
      },
    });
    jobCount++;

    for (const [j, partName] of tpl.parts.entries()) {
      const spec = partsByName.get(partName);
      if (!spec) continue;

      const geo = geometry(spec);
      const mass = round(geo.volume * density(spec.material), 4);

      const component = await prisma.component.create({
        data: {
          name: spec.name,
          material: spec.material,
          stockType: spec.stockType,
          operations: spec.operations,
          notes: spec.notes ?? null,
          jobId: job.id,
          createdAt,
        },
      });
      compCount++;

      // Every component gets a MODEL log with real geometry.
      await prisma.fusionLog.create({
        data: {
          type: "MODEL",
          customerName: tpl.customer,
          revision: pick(["A", "A", "B", "C"], i + j),
          sheetSize: null,
          mass,
          volume: geo.volume,
          surfaceArea: geo.surfaceArea,
          boundingX: geo.boundingX,
          boundingY: geo.boundingY,
          boundingZ: geo.boundingZ,
          bodies: 1,
          components: JSON.stringify([spec.name]),
          notes: null,
          imageData: null,
          componentId: component.id,
          createdAt,
        },
      });
      logCount++;

      // First component of each job also gets a DRAWING log with a PDF.
      if (j === 0 && samplePdf) {
        await prisma.fusionLog.create({
          data: {
            type: "DRAWING",
            customerName: tpl.customer,
            revision: "A",
            sheetSize: pick(["B", "C", "D"], i),
            mass: null,
            volume: null,
            surfaceArea: null,
            boundingX: 0,
            boundingY: 0,
            boundingZ: 0,
            bodies: 0,
            components: JSON.stringify([]),
            notes: null,
            imageData: samplePdf,
            componentId: component.id,
            createdAt,
          },
        });
        logCount++;
      }
    }

    // Time entries that roughly sum to hoursWorked.
    if (tpl.hours > 0) {
      let remaining = tpl.hours;
      let entry = 0;
      while (remaining > 0 && entry < 4) {
        const isLast = remaining <= 6 || entry === 3;
        const hours = isLast
          ? round(remaining, 2)
          : round(Math.min(remaining, 4 + (entry % 3)), 2);
        await prisma.timeEntry.create({
          data: {
            hours,
            note: pick(TIME_NOTES, i + entry),
            date: daysAgo((JOB_TEMPLATES.length - i) * 6 - entry),
            jobId: job.id,
          },
        });
        timeCount++;
        remaining = round(remaining - hours, 2);
        entry++;
      }
    }
  }

  console.log("✓ Seed complete");
  console.log(`  ${jobCount} jobs`);
  console.log(`  ${compCount} components`);
  console.log(`  ${logCount} fusion logs`);
  console.log(`  ${timeCount} time entries`);
  console.log(
    `  Seeded job numbers: ${SEED_JOB_START + 1}–${SEED_JOB_START + jobCount}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
