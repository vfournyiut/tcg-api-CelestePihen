/*
  Warnings:

  - A unique constraint covering the columns `[deckId,cardId]` on the table `DeckCard` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DeckCard_cardId_key";

-- DropIndex
DROP INDEX "DeckCard_deckId_key";

-- CreateIndex
CREATE UNIQUE INDEX "DeckCard_deckId_cardId_key" ON "DeckCard"("deckId", "cardId");
