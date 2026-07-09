-- CreateTable
CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "durationHours" INTEGER NOT NULL DEFAULT 1,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "cancelReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChatThread" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "closedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderRole" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "text" TEXT,
    "mediaUrl" TEXT,
    "durationSeconds" INTEGER,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_code_key" ON "Booking"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatThread_bookingId_key" ON "ChatThread"("bookingId");
CREATE INDEX IF NOT EXISTS "ChatThread_userId_idx" ON "ChatThread"("userId");
CREATE INDEX IF NOT EXISTS "ChatThread_providerUserId_idx" ON "ChatThread"("providerUserId");
CREATE INDEX IF NOT EXISTS "ChatMessage_threadId_createdAt_idx" ON "ChatMessage"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
