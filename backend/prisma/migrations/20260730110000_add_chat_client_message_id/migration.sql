ALTER TABLE "ChatMessage"
ADD COLUMN "clientMessageId" TEXT;

CREATE UNIQUE INDEX "ChatMessage_clientMessageId_key"
ON "ChatMessage"("clientMessageId");
