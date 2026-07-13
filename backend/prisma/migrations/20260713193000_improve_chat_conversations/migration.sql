ALTER TABLE "ChatThread"
  ADD COLUMN IF NOT EXISTS "hiddenForUser" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hiddenForProvider" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ChatMessage"
  ADD COLUMN IF NOT EXISTS "mediaFileId" TEXT,
  ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "ChatThread_userId_providerId_idx"
  ON "ChatThread"("userId", "providerId");
