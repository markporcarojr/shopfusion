import { PrismaClient } from "../app/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";

const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/shopfusion.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const drawing = await prisma.fusionLog.findFirst({
    where: { type: "DRAWING", imageData: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  if (!drawing || !drawing.imageData) {
    console.error("No drawing with imageData found.");
    return;
  }

  fs.writeFileSync("scripts/sample-drawing.txt", drawing.imageData);
  console.log(`✓ Extracted drawing from log #${drawing.id}`);
  console.log(`  Saved ${drawing.imageData.length} chars to scripts/sample-drawing.txt`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());