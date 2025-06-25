-- CreateTable
CREATE TABLE "DetectionMatch" (
    "id" TEXT NOT NULL,
    "detectionResultId" TEXT NOT NULL,
    "matchedUrl" TEXT,
    "similarity" DOUBLE PRECISION,
    "title" TEXT,
    "screenshotUrl" TEXT,

    CONSTRAINT "DetectionMatch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DetectionMatch" ADD CONSTRAINT "DetectionMatch_detectionResultId_fkey" FOREIGN KEY ("detectionResultId") REFERENCES "DetectionResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
