CREATE TABLE "ProviderWatchlist" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderWatchlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderWatchlist_userId_providerId_key"
ON "ProviderWatchlist"("userId", "providerId");

CREATE INDEX "ProviderWatchlist_userId_createdAt_idx"
ON "ProviderWatchlist"("userId", "createdAt");

CREATE INDEX "ProviderWatchlist_providerId_idx"
ON "ProviderWatchlist"("providerId");

ALTER TABLE "ProviderWatchlist"
ADD CONSTRAINT "ProviderWatchlist_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProviderWatchlist"
ADD CONSTRAINT "ProviderWatchlist_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
