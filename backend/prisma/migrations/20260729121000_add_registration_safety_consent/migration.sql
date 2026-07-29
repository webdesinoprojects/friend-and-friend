ALTER TABLE "User"
ADD COLUMN "ageConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "safetyAccepted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "RegistrationApplication"
ADD COLUMN "ageConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "safetyAccepted" BOOLEAN NOT NULL DEFAULT false;
