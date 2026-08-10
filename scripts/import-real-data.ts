import "dotenv/config";
import Database from "better-sqlite3";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const SQLITE_PATH = "prisma/shopfusion.db";
const JOB_OFFSET = 800000; // real job numbers get bumped here to avoid seed collisions

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const sqlite = new Database(SQLITE_PATH, { readonly: true });

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      clerkId: "user_3HYUIKvVyM9PgH8ykMj16JNYkHR",
    },
  });
  if (!user) {
    console.error("No user in Neon — sign in on the app first.");
    process.exit(1);
  }
  console.log(`Importing into user ${user.id}...`);

  const jobs = sqlite.prepare("SELECT * FROM Job").all() as any[];
  const components = sqlite.prepare("SELECT * FROM Component").all() as any[];
  const logs = sqlite.prepare("SELECT * FROM FusionLog").all() as any[];
  const times = sqlite.prepare("SELECT * FROM TimeEntry").all() as any[];

  let jobN = 0,
    compN = 0,
    logN = 0,
    timeN = 0;

  for (const j of jobs) {
    const newJob = await prisma.job.create({
      data: {
        jobNumber: j.jobNumber ? j.jobNumber + JOB_OFFSET : null,
        customerName: j.customerName,
        description: j.description,
        status: j.status,
        hoursWorked: j.hoursWorked,
        userId: user.id,
        createdAt: new Date(j.createdAt),
        updatedAt: new Date(j.updatedAt),
      },
    });
    jobN++;

    const jobComps = components.filter((c) => c.jobId === j.id);
    for (const c of jobComps) {
      const newComp = await prisma.component.create({
        data: {
          name: c.name,
          material: c.material,
          stockType: c.stockType,
          operations: c.operations,
          notes: c.notes,
          jobId: newJob.id,
          createdAt: new Date(c.createdAt),
        },
      });
      compN++;

      const compLogs = logs.filter((l) => l.componentId === c.id);
      for (const l of compLogs) {
        await prisma.fusionLog.create({
          data: {
            type: l.type,
            customerName: l.customerName,
            revision: l.revision,
            sheetSize: l.sheetSize,
            mass: l.mass,
            volume: l.volume,
            surfaceArea: l.surfaceArea,
            boundingX: l.boundingX,
            boundingY: l.boundingY,
            boundingZ: l.boundingZ,
            bodies: l.bodies,
            components: l.components,
            notes: l.notes,
            imageData: l.imageData, // the real PDF
            componentId: newComp.id,
            createdAt: new Date(l.createdAt),
          },
        });
        logN++;
      }
    }

    const jobTimes = times.filter((t) => t.jobId === j.id);
    for (const t of jobTimes) {
      await prisma.timeEntry.create({
        data: {
          hours: t.hours,
          note: t.note,
          date: new Date(t.date),
          jobId: newJob.id,
        },
      });
      timeN++;
    }
  }

  console.log("✓ Import complete");
  console.log(
    `  ${jobN} jobs, ${compN} components, ${logN} fusion logs, ${timeN} time entries`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    sqlite.close();
    prisma.$disconnect();
  });
