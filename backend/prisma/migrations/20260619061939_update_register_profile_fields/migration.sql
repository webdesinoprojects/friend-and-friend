/*
  Warnings:

  - You are about to drop the column `experience` on the `ProviderProfile` table. All the data in the column will be lost.
  - You are about to drop the column `services` on the `ProviderProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "KycVerification" ADD COLUMN     "documentNumberLast4" TEXT,
ADD COLUMN     "documentType" TEXT,
ALTER COLUMN "aadhaarLast4" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProviderProfile" DROP COLUMN "experience",
DROP COLUMN "services",
ADD COLUMN     "education" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "hobbies" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;
