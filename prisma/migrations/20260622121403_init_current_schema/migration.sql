/*
  Warnings:

  - You are about to drop the column `jobId` on the `FusionLog` table. All the data in the column will be lost.
  - You are about to drop the column `modelName` on the `FusionLog` table. All the data in the column will be lost.
  - Added the required column `customerName` to the `FusionLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" ADD COLUMN "hoursWorked" REAL;

-- CreateTable
CREATE TABLE "Component" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "material" TEXT,
    "stockType" TEXT NOT NULL DEFAULT 'AUTO',
    "operations" TEXT,
    "notes" TEXT,
    "jobId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Component_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FusionLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL DEFAULT 'MODEL',
    "customerName" TEXT NOT NULL,
    "revision" TEXT,
    "sheetSize" TEXT,
    "mass" REAL,
    "volume" REAL,
    "surfaceArea" REAL,
    "boundingX" REAL NOT NULL DEFAULT 0,
    "boundingY" REAL NOT NULL DEFAULT 0,
    "boundingZ" REAL NOT NULL DEFAULT 0,
    "bodies" INTEGER NOT NULL DEFAULT 0,
    "components" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "imageData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "componentId" INTEGER,
    CONSTRAINT "FusionLog_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FusionLog" ("bodies", "boundingX", "boundingY", "boundingZ", "components", "createdAt", "id", "imageData", "notes", "type") SELECT "bodies", "boundingX", "boundingY", "boundingZ", "components", "createdAt", "id", "imageData", "notes", "type" FROM "FusionLog";
DROP TABLE "FusionLog";
ALTER TABLE "new_FusionLog" RENAME TO "FusionLog";
CREATE INDEX "FusionLog_componentId_idx" ON "FusionLog"("componentId");
CREATE TABLE "new_TimeEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hours" REAL NOT NULL,
    "note" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" INTEGER NOT NULL,
    CONSTRAINT "TimeEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TimeEntry" ("date", "hours", "id", "jobId", "note") SELECT "date", "hours", "id", "jobId", "note" FROM "TimeEntry";
DROP TABLE "TimeEntry";
ALTER TABLE "new_TimeEntry" RENAME TO "TimeEntry";
CREATE INDEX "TimeEntry_jobId_idx" ON "TimeEntry"("jobId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Component_jobId_idx" ON "Component"("jobId");
