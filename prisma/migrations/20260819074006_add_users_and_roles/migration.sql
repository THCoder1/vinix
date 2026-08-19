-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'MANAGER', 'SALES', 'VIEWER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'SALES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "public"."User"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "VehicleEvent_userId_idx" ON "public"."VehicleEvent"("userId");

-- AddForeignKey
ALTER TABLE "public"."VehicleEvent" ADD CONSTRAINT "VehicleEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
