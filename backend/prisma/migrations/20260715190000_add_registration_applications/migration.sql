CREATE TABLE "RegistrationApplication" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "dob" TEXT,
  "gender" TEXT,
  "city" TEXT,
  "state" TEXT,
  "role" "UserRole" NOT NULL,
  "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "profileImage" TEXT,
  "referenceSelfie" TEXT,
  "documentType" TEXT NOT NULL,
  "documentNumber" TEXT NOT NULL,
  "documentLast4" TEXT,
  "documentUrl" TEXT NOT NULL,
  "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
  "userProfile" JSONB,
  "providerProfile" JSONB,
  "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "rejectionReason" TEXT,
  "decisionAt" TIMESTAMP(3),
  "approvedUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegistrationApplication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RegistrationApplication_email_key" ON "RegistrationApplication"("email");
CREATE UNIQUE INDEX "RegistrationApplication_phone_key" ON "RegistrationApplication"("phone");
CREATE INDEX "RegistrationApplication_status_createdAt_idx" ON "RegistrationApplication"("status", "createdAt");

INSERT INTO "RegistrationApplication" (
  "id","fullName","email","phone","passwordHash","dob","gender","city","state","role",
  "mobileVerified","emailVerified","profileImage","referenceSelfie","documentType","documentNumber",
  "documentLast4","documentUrl","consentAccepted","userProfile","providerProfile","status",
  "rejectionReason","createdAt","updatedAt"
)
SELECT
  u."id",u."fullName",u."email",u."phone",COALESCE(u."passwordHash",''),u."dob",u."gender",u."city",u."state",u."role",
  u."mobileVerified",u."emailVerified",u."profileImage",u."referenceSelfie",COALESCE(k."documentType",'IDENTITY_PROOF'),
  COALESCE(k."documentNumber",k."documentNumberLast4",u."aadhaarLast4",'NOT_PROVIDED'),
  COALESCE(k."documentNumberLast4",u."aadhaarLast4"),COALESCE(k."documentUrl",''),COALESCE(k."consentAccepted",false),
  CASE WHEN up."id" IS NULL THEN NULL ELSE to_jsonb(up) - 'id' - 'userId' - 'createdAt' - 'updatedAt' END,
  CASE WHEN pp."id" IS NULL THEN NULL ELSE to_jsonb(pp) - 'id' - 'userId' - 'createdAt' - 'updatedAt' END,
  u."kycStatus",k."rejectionReason",u."createdAt",u."updatedAt"
FROM "User" u
LEFT JOIN "KycVerification" k ON k."userId"=u."id"
LEFT JOIN "UserProfile" up ON up."userId"=u."id"
LEFT JOIN "ProviderProfile" pp ON pp."userId"=u."id"
WHERE u."role" IN ('USER','PROVIDER') AND u."kycStatus" <> 'VERIFIED' AND u."email" IS NOT NULL
ON CONFLICT DO NOTHING;

DELETE FROM "User" WHERE "role" IN ('USER','PROVIDER') AND "kycStatus" <> 'VERIFIED';
