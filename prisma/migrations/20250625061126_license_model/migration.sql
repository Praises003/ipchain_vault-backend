-- AlterTable
ALTER TABLE "DetectionResult" ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceIcon" TEXT;

-- AlterTable
ALTER TABLE "License" ADD COLUMN     "stripePaymentIntentId" TEXT;
