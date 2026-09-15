-- CreateEnum
CREATE TYPE "WriteupStatus" AS ENUM ('idle', 'queued', 'running', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "DrillKind" AS ENUM ('blunder_preventer', 'replay_mistake', 'defend_worse', 'convert_advantage', 'make_plan');

-- CreateEnum
CREATE TYPE "DrillStatus" AS ENUM ('assigned', 'due', 'done', 'retired');

-- CreateEnum
CREATE TYPE "DrillAttemptResult" AS ENUM ('hit', 'miss', 'abandoned');

-- CreateTable
CREATE TABLE "ProfileWriteup" (
    "userId" TEXT NOT NULL,
    "status" "WriteupStatus" NOT NULL DEFAULT 'idle',
    "payload" JSONB,
    "model" TEXT,
    "error" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileWriteup_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "userId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Drill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "DrillKind" NOT NULL,
    "stepId" TEXT NOT NULL,
    "fen" TEXT NOT NULL,
    "playerColor" TEXT NOT NULL,
    "sourceGameId" TEXT NOT NULL,
    "sourcePly" INTEGER NOT NULL,
    "stem" TEXT NOT NULL,
    "goalUci" TEXT[],
    "goalSan" TEXT[],
    "leak" TEXT,
    "status" "DrillStatus" NOT NULL DEFAULT 'due',
    "dueAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "lastResult" "DrillAttemptResult",
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrillAttempt" (
    "id" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playedUci" TEXT[],
    "result" "DrillAttemptResult" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrillAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Drill_userId_sourceGameId_sourcePly_kind_key" ON "Drill"("userId", "sourceGameId", "sourcePly", "kind");

-- CreateIndex
CREATE INDEX "Drill_userId_status_dueAt_idx" ON "Drill"("userId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Drill_userId_stepId_idx" ON "Drill"("userId", "stepId");

-- CreateIndex
CREATE INDEX "DrillAttempt_userId_createdAt_idx" ON "DrillAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DrillAttempt_drillId_createdAt_idx" ON "DrillAttempt"("drillId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProfileWriteup" ADD CONSTRAINT "ProfileWriteup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drill" ADD CONSTRAINT "Drill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillAttempt" ADD CONSTRAINT "DrillAttempt_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillAttempt" ADD CONSTRAINT "DrillAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
