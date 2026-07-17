ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT,
  ADD COLUMN IF NOT EXISTS "razorpaySignature" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_razorpayOrderId_key" ON "Booking"("razorpayOrderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_razorpayPaymentId_key" ON "Booking"("razorpayPaymentId");
