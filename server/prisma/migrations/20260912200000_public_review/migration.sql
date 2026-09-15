-- CreateEnum
CREATE TYPE "PublicReviewStatus" AS ENUM ('queued', 'running', 'ready', 'failed');

-- CreateTable
CREATE TABLE "PublicReview" (
    "id" TEXT NOT NULL,
    "source" "GameSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pgn" TEXT NOT NULL,
    "whiteName" TEXT NOT NULL,
    "blackName" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "timeControl" "TimeControl",
    "playedAt" TIMESTAMP(3),
    "whiteRating" INTEGER,
    "blackRating" INTEGER,
    "status" "PublicReviewStatus" NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "plies" JSONB,
    "review" JSONB,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicReview_source_externalId_key" ON "PublicReview"("source", "externalId");

-- CreateIndex
CREATE INDEX "PublicReview_status_createdAt_idx" ON "PublicReview"("status", "createdAt");
