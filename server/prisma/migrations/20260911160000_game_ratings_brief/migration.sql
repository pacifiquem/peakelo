-- AlterTable
ALTER TABLE "Game" ADD COLUMN "whiteRating" INTEGER;
ALTER TABLE "Game" ADD COLUMN "blackRating" INTEGER;

-- CreateTable
CREATE TABLE "GameBrief" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameBrief_gameId_key" ON "GameBrief"("gameId");

-- AddForeignKey
ALTER TABLE "GameBrief" ADD CONSTRAINT "GameBrief_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
