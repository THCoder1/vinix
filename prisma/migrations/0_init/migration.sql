-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('AUCTION_INVOICE', 'PURCHASE_INVOICE', 'TRANSPORT_INVOICE', 'WORKSHOP_INVOICE', 'REGISTRATION', 'ITV', 'WARRANTY', 'SALES_INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExpenseCategory" AS ENUM ('MECHANICAL', 'PARTS', 'TYRES', 'BODYWORK', 'PAINT', 'DETAILING', 'ITV', 'GESTORIA', 'REGISTRATION', 'TRANSPORT', 'WARRANTY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."FuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'LPG', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."OcrStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."VehicleEventType" AS ENUM ('VEHICLE_CREATED',
'ACQUISITION_CREATED',
'AUCTION_INVOICE_UPLOADED',
'ACQUISITION_APPROVED',
'EXPENSE_ADDED',
'PRICE_CHANGED',
'STATUS_CHANGED',
'VEHICLE_RESERVED',
'VEHICLE_SOLD',
'DOCUMENT_UPLOADED');

-- CreateEnum
CREATE TYPE "public"."VehicleStatus" AS ENUM ('PURCHASED', 'IN_PREPARATION', 'READY_FOR_SALE', 'RESERVED', 'SOLD', 'HOLD', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Acquisition" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "supplier" TEXT,
    "auctionHouse" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "auctionFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transportCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Acquisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "source" TEXT,
    "ocrStatus" "public"."OcrStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "category" "public"."ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "supplier" TEXT,
    "invoiceNumber" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "saleDate" TIMESTAMP(3),
    "salePrice" DECIMAL(12,2) NOT NULL,
    "invoiceNumber" TEXT,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vehicle" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "registration" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT,
    "firstRegistration" TIMESTAMP(3),
    "mileage" INTEGER,
    "fuel" "public"."FuelType",
    "engine" TEXT,
    "transmission" TEXT,
    "colour" TEXT,
    "status" "public"."VehicleStatus" NOT NULL DEFAULT 'PURCHASED',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleEvent" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "eventType" "public"."VehicleEventType" NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehiclePhoto" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "url" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Acquisition_documentId_key" ON "public"."Acquisition"("documentId" ASC);

-- CreateIndex
CREATE INDEX "Acquisition_invoiceNumber_idx" ON "public"."Acquisition"("invoiceNumber" ASC);

-- CreateIndex
CREATE INDEX "Acquisition_vehicleId_idx" ON "public"."Acquisition"("vehicleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Acquisition_vehicleId_key" ON "public"."Acquisition"("vehicleId" ASC);

-- CreateIndex
CREATE INDEX "Document_ocrStatus_idx" ON "public"."Document"("ocrStatus" ASC);

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "public"."Document"("type" ASC);

-- CreateIndex
CREATE INDEX "Document_vehicleId_idx" ON "public"."Document"("vehicleId" ASC);

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "public"."Expense"("category" ASC);

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "public"."Expense"("date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Expense_documentId_key" ON "public"."Expense"("documentId" ASC);

-- CreateIndex
CREATE INDEX "Expense_vehicleId_idx" ON "public"."Expense"("vehicleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_documentId_key" ON "public"."Sale"("documentId" ASC);

-- CreateIndex
CREATE INDEX "Sale_saleDate_idx" ON "public"."Sale"("saleDate" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_vehicleId_key" ON "public"."Sale"("vehicleId" ASC);

-- CreateIndex
CREATE INDEX "Vehicle_make_model_idx" ON "public"."Vehicle"("make" ASC, "model" ASC);

-- CreateIndex
CREATE INDEX "Vehicle_registration_idx" ON "public"."Vehicle"("registration" ASC);

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "public"."Vehicle"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "public"."Vehicle"("vin" ASC);

-- CreateIndex
CREATE INDEX "VehicleEvent_vehicleId_createdAt_idx" ON "public"."VehicleEvent"("vehicleId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "VehiclePhoto_vehicleId_idx" ON "public"."VehiclePhoto"("vehicleId" ASC);

-- CreateIndex
CREATE INDEX "VehiclePhoto_vehicleId_sortOrder_idx" ON "public"."VehiclePhoto"("vehicleId" ASC, "sortOrder" ASC);

-- AddForeignKey
ALTER TABLE "public"."Acquisition" ADD CONSTRAINT "Acquisition_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Acquisition" ADD CONSTRAINT "Acquisition_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleEvent" ADD CONSTRAINT "VehicleEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
