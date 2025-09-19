-- CreateEnum
CREATE TYPE "PlanKey" AS ENUM ('TRIAL', 'BASIC', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Team"
  ADD COLUMN "planKey" "PlanKey" NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN "trialEndsAt" TIMESTAMP(3);

-- Align existing teams with new enums when possible
UPDATE "Team"
SET "planKey" = 'PRO', "subscriptionStatus" = 'ACTIVE'
WHERE LOWER(COALESCE("plan"->>'name', '')) LIKE '%pro%';

UPDATE "Team"
SET "planKey" = 'BASIC', "subscriptionStatus" = 'ACTIVE'
WHERE LOWER(COALESCE("plan"->>'name', '')) LIKE '%basic%';

UPDATE "Team"
SET "trialEndsAt" = NOW() + interval '14 days'
WHERE "planKey" = 'TRIAL' AND "trialEndsAt" IS NULL;
