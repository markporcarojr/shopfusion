-- AlterTable
ALTER TABLE "FusionLog" ADD COLUMN     "imageData" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'MODEL';
