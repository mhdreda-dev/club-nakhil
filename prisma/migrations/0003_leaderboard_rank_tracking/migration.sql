-- AlterTable
ALTER TABLE "MemberProfile"
ADD COLUMN "rankChange" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "leaderboardUpdatedAt" TIMESTAMP(3);
