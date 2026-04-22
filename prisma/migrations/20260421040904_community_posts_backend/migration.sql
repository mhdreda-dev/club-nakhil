-- CreateEnum
CREATE TYPE "CommunityPostType" AS ENUM ('PHOTO', 'ACHIEVEMENT', 'TEXT', 'SUPPORT');

-- CreateEnum
CREATE TYPE "CommunityPostCategory" AS ENUM ('ACHIEVEMENTS', 'TRAINING', 'EVENTS');

-- CreateEnum
CREATE TYPE "CommunityPostStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "CommunityReactionType" AS ENUM ('LIKE', 'FIRE', 'CLAP');

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postType" "CommunityPostType" NOT NULL,
    "category" "CommunityPostCategory" NOT NULL,
    "caption" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imagePath" TEXT,
    "status" "CommunityPostStatus" NOT NULL DEFAULT 'VISIBLE',
    "pinnedByCoach" BOOLEAN NOT NULL DEFAULT false,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "moderatedById" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" "CommunityReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityPost_status_createdAt_idx" ON "CommunityPost"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityPost_category_createdAt_idx" ON "CommunityPost"("category", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_createdAt_idx" ON "CommunityPost"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityComment_postId_createdAt_idx" ON "CommunityComment"("postId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "CommunityComment_authorId_idx" ON "CommunityComment"("authorId");

-- CreateIndex
CREATE INDEX "CommunityReaction_postId_reactionType_idx" ON "CommunityReaction"("postId", "reactionType");

-- CreateIndex
CREATE INDEX "CommunityReaction_userId_idx" ON "CommunityReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityReaction_postId_userId_reactionType_key" ON "CommunityReaction"("postId", "userId", "reactionType");

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
