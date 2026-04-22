-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "fullName" TEXT,
ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "phone" TEXT,
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "gender" "Gender",
ADD COLUMN "address" TEXT,
ADD COLUMN "emergencyContact" TEXT,
ADD COLUMN "sportLevel" "TrainingLevel",
ADD COLUMN "membershipType" "MembershipType",
ADD COLUMN "profileImage" TEXT;

-- Backfill existing users
UPDATE "User"
SET "fullName" = "name"
WHERE "fullName" IS NULL;

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
