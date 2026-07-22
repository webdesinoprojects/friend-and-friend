ALTER TABLE "Booking"
  ADD COLUMN "startPin" TEXT,
  ADD COLUMN "startPinExpiresAt" TIMESTAMP(3),
  ADD COLUMN "startPinUsedAt" TIMESTAMP(3),
  ADD COLUMN "meetingStartedAt" TIMESTAMP(3),
  ADD COLUMN "scheduledEndAt" TIMESTAMP(3),
  ADD COLUMN "meetingEndedAt" TIMESTAMP(3),
  ADD COLUMN "endOtp" TEXT,
  ADD COLUMN "endOtpCreatedAt" TIMESTAMP(3),
  ADD COLUMN "endOtpVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "extensionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastHourlyPrice" INTEGER;

CREATE TABLE "BookingExtension" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "hours" INTEGER NOT NULL DEFAULT 1,
  "discountPercent" INTEGER NOT NULL DEFAULT 10,
  "amount" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "razorpayOrderId" TEXT NOT NULL,
  "razorpayPaymentId" TEXT,
  "razorpaySignature" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingExtension_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingExtension_razorpayOrderId_key" ON "BookingExtension"("razorpayOrderId");
CREATE UNIQUE INDEX "BookingExtension_razorpayPaymentId_key" ON "BookingExtension"("razorpayPaymentId");
CREATE UNIQUE INDEX "BookingExtension_bookingId_sequence_key" ON "BookingExtension"("bookingId", "sequence");
CREATE INDEX "BookingExtension_bookingId_status_idx" ON "BookingExtension"("bookingId", "status");
ALTER TABLE "BookingExtension" ADD CONSTRAINT "BookingExtension_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
