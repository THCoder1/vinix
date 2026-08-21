-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "ocrData" JSONB,
ADD COLUMN     "ocrError" TEXT,
ADD COLUMN     "ocrProcessedAt" TIMESTAMP(3),
ADD COLUMN     "ocrReviewedAt" TIMESTAMP(3);
