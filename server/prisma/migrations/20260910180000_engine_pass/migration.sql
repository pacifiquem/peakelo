-- CreateEnum
CREATE TYPE "EnginePassStatus" AS ENUM ('idle', 'queued', 'running', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "GameAnalysisStatus" AS ENUM ('pending', 'running', 'ready', 'failed');

-- CreateTable
CREATE TABLE "EnginePass" (
    "userId" TEXT NOT NULL,
    "status" "EnginePassStatus" NOT NULL DEFAULT 'idle',
    "gamesQueued" INTEGER NOT NULL DEFAULT 0,
    "gamesReady" INTEGER NOT NULL DEFAULT 0,
    "gamesFailed" INTEGER NOT NULL DEFAULT 0,
    "movesAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "movesTotal" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 12,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnginePass_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GameAnalysis" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "GameAnalysisStatus" NOT NULL DEFAULT 'pending',
    "depth" INTEGER NOT NULL DEFAULT 12,
    "analyzedPlies" INTEGER NOT NULL DEFAULT 0,
    "totalPlies" INTEGER NOT NULL DEFAULT 0,
    "playerAcpl" DOUBLE PRECISION,
    "error" TEXT,
    "plies" JSONB,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameAnalysis_gameId_key" ON "GameAnalysis"("gameId");

-- CreateIndex
CREATE INDEX "GameAnalysis_userId_status_idx" ON "GameAnalysis"("userId", "status");

-- CreateIndex
CREATE INDEX "GameAnalysis_status_idx" ON "GameAnalysis"("status");

-- AddForeignKey
ALTER TABLE "EnginePass" ADD CONSTRAINT "EnginePass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAnalysis" ADD CONSTRAINT "GameAnalysis_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAnalysis" ADD CONSTRAINT "GameAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
