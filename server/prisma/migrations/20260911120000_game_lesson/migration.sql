-- CreateTable
CREATE TABLE "GameLesson" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "ply" INTEGER NOT NULL,
    "fen" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameLesson_gameId_ply_key" ON "GameLesson"("gameId", "ply");

-- CreateIndex
CREATE INDEX "GameLesson_gameId_idx" ON "GameLesson"("gameId");

-- AddForeignKey
ALTER TABLE "GameLesson" ADD CONSTRAINT "GameLesson_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
