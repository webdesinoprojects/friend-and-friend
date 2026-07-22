UPDATE "Booking"
SET
  "startPin" = LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0'),
  "startPinExpiresAt" = NOW() + INTERVAL '14 days',
  "lastHourlyPrice" = GREATEST(1, ROUND("amount"::NUMERIC / GREATEST(1, "durationHours"))::INTEGER)
WHERE
  "paymentStatus" = 'PAID'
  AND "status" = 'CONFIRMED'
  AND "startPin" IS NULL;
