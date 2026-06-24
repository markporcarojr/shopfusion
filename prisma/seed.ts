import { PrismaClient } from "../app/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";

const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/shopfusion.db",
});
const prisma = new PrismaClient({ adapter });

const SAMPLE_DRAWING = fs.readFileSync("scripts/sample-drawing.txt", "utf-8");

const CUSTOMERS = [
  "Bristol Machine",
  "Detroit Hydraulics",
  "Acme Fabrication",
  "Great Lakes Mfg",
  "Motor City Tool",
  "Saginaw Steel",
  "Midwest Gear",
  "Precision Dynamics",
  "Thunder Bay Machine",
  "Oakland Industrial",
];

const MATERIALS = ["4140 Steel", "1045 Steel", "6061-T6 Aluminum", "303 Stainless Steel", "1018 Steel"];
const STOCK_TYPES = ["ROUND_BAR", "PLATE", "TUBE", "SQUARE_BAR"];
const STATUSES = ["ACTIVE", "PAUSED", "DONE"];

const COMPONENT_NAMES = [
  "Bearing Cover", "Retaining Ring", "Drive Shaft", "Spacer Block",
  "Bushing", "Flange", "Pivot Pin", "End Cap", "Coupling", "Bracket",
  "Adapter Plate", "Roller", "Hub", "Collar", "Gland", "Piston",
  "Guide Rod", "Mount", "Sleeve", "Insert",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randDim(): number {
  return Math.round((Math.random() * 6 + 0.5) * 1000) / 1000;
}

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found. Sign into the app first.");
    return;
  }

  console.log(`Seeding for user ${user.id}...`);

  let compIndex = 0;

  for (let i = 0; i < 10; i++) {
    const job = await prisma.job.create({
      data: {
        jobNumber: 33500 + i,
        customerName: rand(CUSTOMERS),
        description: `Job ${33500 + i} — production run`,
        status: rand(STATUSES),
        hoursWorked: Math.round(Math.random() * 20 * 4) / 4,
        userId: user.id,
      },
    });

    // 2 components per job
    for (let j = 0; j < 2; j++) {
      const isDrawing = j === 0; // first component gets a drawing, second a model
      const x = randDim();
      const y = isDrawing ? randDim() : x; // make second one cylindrical-ish
      const z = randDim();

      const component = await prisma.component.create({
        data: {
          name: COMPONENT_NAMES[compIndex % COMPONENT_NAMES.length],
          material: rand(MATERIALS),
          stockType: rand(STOCK_TYPES),
          operations: "Face, turn, bore, deburr",
          jobId: job.id,
        },
      });
      compIndex++;

      // Add a fusion log to each component
      await prisma.fusionLog.create({
        data: {
          type: isDrawing ? "DRAWING" : "MODEL",
          customerName: component.name,
          revision: rand(["A", "B", "C"]),
          sheetSize: isDrawing ? rand(["B", "C", "D"]) : null,
          mass: Math.round(Math.random() * 10 * 1000) / 1000,
          volume: Math.round(Math.random() * 20 * 1000) / 1000,
          surfaceArea: Math.round(Math.random() * 50 * 1000) / 1000,
          boundingX: x,
          boundingY: y,
          boundingZ: z,
          bodies: 1,
          components: JSON.stringify([component.name]),
          imageData: isDrawing ? SAMPLE_DRAWING : null,
          componentId: component.id,
        },
      });
    }

    // Time entries
    await prisma.timeEntry.create({
      data: {
        hours: Math.round(Math.random() * 8 * 4) / 4,
        note: "Setup and run",
        jobId: job.id,
      },
    });
  }

  console.log("✓ Seed complete: 10 jobs, 20 components, 20 fusion logs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());