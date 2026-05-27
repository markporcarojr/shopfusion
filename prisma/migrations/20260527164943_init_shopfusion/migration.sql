-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DONE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "jobNumber" INTEGER,
    "customerName" TEXT NOT NULL,
    "description" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PAUSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" SERIAL NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" INTEGER NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FusionLog" (
    "id" SERIAL NOT NULL,
    "modelName" TEXT NOT NULL,
    "boundingX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "boundingY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "boundingZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bodies" INTEGER NOT NULL DEFAULT 0,
    "components" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" INTEGER,

    CONSTRAINT "FusionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Job_userId_idx" ON "Job"("userId");

-- CreateIndex
CREATE INDEX "TimeEntry_jobId_idx" ON "TimeEntry"("jobId");

-- CreateIndex
CREATE INDEX "FusionLog_jobId_idx" ON "FusionLog"("jobId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FusionLog" ADD CONSTRAINT "FusionLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
