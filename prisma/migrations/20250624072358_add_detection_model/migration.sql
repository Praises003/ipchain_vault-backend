-- CreateTable
CREATE TABLE "DetectionResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "matchedUrl" TEXT,
    "similarity" DOUBLE PRECISION,
    "detectionType" TEXT NOT NULL,
    "detectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "screenshotUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'matched',

    CONSTRAINT "DetectionResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DetectionResult" ADD CONSTRAINT "DetectionResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectionResult" ADD CONSTRAINT "DetectionResult_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
