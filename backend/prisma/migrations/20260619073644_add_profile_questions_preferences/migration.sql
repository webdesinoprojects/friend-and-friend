-- AlterTable
ALTER TABLE "ProviderProfile" ADD COLUMN     "profileQuestions" JSONB;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "activityPreferences" TEXT,
ADD COLUMN     "profileQuestions" JSONB;
