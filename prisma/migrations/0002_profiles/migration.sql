-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "city" TEXT,
    "address" TEXT,
    "bio" TEXT,
    "emergencyContact" TEXT,
    "avatarUrl" TEXT,
    "avatarPath" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "userId" TEXT NOT NULL,
    "specialization" TEXT,
    "yearsOfExperience" INTEGER,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coachingStyle" TEXT,
    "achievements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "MemberProfile" (
    "userId" TEXT NOT NULL,
    "trainingLevel" "TrainingLevel" NOT NULL DEFAULT 'BEGINNER',
    "preferredTrainingType" "TrainingType",
    "attendanceCount" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "overallRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentRank" INTEGER,
    "previousRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "MemberProfile_currentRank_idx" ON "MemberProfile"("currentRank");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
