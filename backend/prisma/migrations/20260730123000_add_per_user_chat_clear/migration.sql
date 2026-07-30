ALTER TABLE "ChatThread"
ADD COLUMN "clearedForUserAt" TIMESTAMP(3),
ADD COLUMN "clearedForProviderAt" TIMESTAMP(3);
