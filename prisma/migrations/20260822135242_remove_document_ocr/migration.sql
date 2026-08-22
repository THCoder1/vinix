/*
  Warnings:

  - You are about to drop the column `ocrData` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `ocrError` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `ocrProcessedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `ocrReviewedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `ocrStatus` on the `Document` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Document_ocrStatus_idx";

-- AlterTable
ALTER TABLE "public"."Document" DROP COLUMN "ocrData",
DROP COLUMN "ocrError",
DROP COLUMN "ocrProcessedAt",
DROP COLUMN "ocrReviewedAt",
DROP COLUMN "ocrStatus";
