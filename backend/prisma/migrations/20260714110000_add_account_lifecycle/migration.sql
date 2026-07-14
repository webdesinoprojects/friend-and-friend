ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "disabledUntil" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_disabledUntil_idx"
  ON "User"("disabledUntil");

CREATE TABLE IF NOT EXISTS "AccountDeletionAudit" (
  "id" TEXT NOT NULL,
  "originalUserId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountDeletionAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccountDeletionAudit_originalUserId_key"
  ON "AccountDeletionAudit"("originalUserId");

CREATE INDEX IF NOT EXISTS "AccountDeletionAudit_role_deletedAt_idx"
  ON "AccountDeletionAudit"("role", "deletedAt");
