-- NOTE: This migration intentionally rebuilds Prisma-managed tables.
-- Downtime is acceptable and deployment truncates data beforehand.
DROP TABLE IF EXISTS "postrapide" CASCADE;
DROP TABLE IF EXISTS "menu" CASCADE;
DROP TABLE IF EXISTS "logo" CASCADE;
DROP TABLE IF EXISTS "Competitor" CASCADE;
DROP TABLE IF EXISTS "ActionTask" CASCADE;
DROP TABLE IF EXISTS "MagicToken" CASCADE;
DROP TABLE IF EXISTS "ResetToken" CASCADE;
DROP TABLE IF EXISTS "VerifyToken" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "DataImage" CASCADE;
DROP TABLE IF EXISTS "DraftPost" CASCADE;
DROP TABLE IF EXISTS "WeeklyPlanning" CASCADE;
DROP TABLE IF EXISTS "Strategy" CASCADE;
DROP TABLE IF EXISTS "Preference" CASCADE;
DROP TABLE IF EXISTS "Activity" CASCADE;
DROP TABLE IF EXISTS "Campaign" CASCADE;
DROP TABLE IF EXISTS "SocialAccount" CASCADE;
DROP TABLE IF EXISTS "Post" CASCADE;
DROP TABLE IF EXISTS "TokenLog" CASCADE;
DROP TABLE IF EXISTS "TokenPackage" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "UserSubscription" CASCADE;
DROP TABLE IF EXISTS "Plan" CASCADE;
DROP TABLE IF EXISTS "Referral" CASCADE;
DROP TABLE IF EXISTS "UserDiscussionCode" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileKey" TEXT,
    "ayrshareUserId" TEXT,
    "tokenBalance" INTEGER NOT NULL DEFAULT 50,
    "tokenUsed" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "mamoCustomerId" TEXT,
    "referralCode" TEXT,
    "referredByCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDiscussionCode" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "code" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDiscussionCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" BIGINT NOT NULL,
    "refereeId" BIGINT NOT NULL,
    "tokensAwarded" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPrice" INTEGER NOT NULL,
    "yearlyPrice" INTEGER NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "platformLimit" INTEGER NOT NULL DEFAULT 3,
    "features" TEXT NOT NULL,
    "locked" TEXT NOT NULL DEFAULT '[]',
    "watermark" BOOLEAN NOT NULL DEFAULT false,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingType" TEXT NOT NULL DEFAULT 'monthly',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "mamoSubscriptionId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mamopay',
    "providerPaymentId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenLog" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "agent" TEXT NOT NULL DEFAULT 'Content',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "platform" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags" TEXT,
    "mediaUrls" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "ayrshareId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "connected" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "platforms" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "roi" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isAI" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "ageRange" TEXT,
    "interests" TEXT,
    "ayrsharePostIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "business_name" TEXT,
    "industry" TEXT,
    "business_description" TEXT,
    "location" TEXT,
    "opening_hours" TEXT,
    "business_size" TEXT,
    "year_founded" TEXT,
    "audience_target" TEXT,
    "unique_selling_point" TEXT,
    "certifications" TEXT,
    "resumer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "action" TEXT,
    "color" TEXT,
    "tone_of_voice" TEXT,
    "language_preference" TEXT,
    "social_media_goals" TEXT,
    "preferred_platforms" TEXT,
    "hashtags" TEXT,
    "emojis" TEXT,
    "other" TEXT,
    "resumer" TEXT,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "periodStartDate" TIMESTAMP(3),
    "periodEndDate" TIMESTAMP(3),
    "weekCount" INTEGER NOT NULL DEFAULT 8,
    "goal" TEXT,
    "platforms" TEXT,
    "n8nSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlanning" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekStartDate" TIMESTAMP(3),
    "weekEndDate" TIMESTAMP(3),
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "weeklyGoal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPlanning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftPost" (
    "id" TEXT NOT NULL,
    "weeklyPlanningId" TEXT NOT NULL,
    "platform" TEXT,
    "caption" TEXT,
    "hashtags" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "postDate" TIMESTAMP(3),
    "postTime" TEXT,
    "postDetails" TEXT,
    "postReminder" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataImage" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifyToken" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifyToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionTask" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "strategyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "postsPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSynced" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logo" (
    "id" BIGSERIAL NOT NULL,
    "description" TEXT,
    "name" VARCHAR(255),
    "url" TEXT,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "logo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu" (
    "id" BIGSERIAL NOT NULL,
    "description" TEXT,
    "name" VARCHAR(255),
    "url" TEXT,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postrapide" (
    "id" BIGSERIAL NOT NULL,
    "platforme" VARCHAR(255),
    "post" TEXT,
    "url" TEXT,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "postrapide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscussionCode_userId_key" ON "UserDiscussionCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscussionCode_code_key" ON "UserDiscussionCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscussionCode_key_key" ON "UserDiscussionCode"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_refereeId_key" ON "Referral"("refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_userId_platform_key" ON "SocialAccount"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_userId_key" ON "Activity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_key" ON "Preference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ResetToken_token_key" ON "ResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "MagicToken_token_key" ON "MagicToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "logo_user_id_key" ON "logo"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_user_id_key" ON "menu"("user_id");

-- CreateIndex
CREATE INDEX "postrapide_user_id_idx" ON "postrapide"("user_id");

-- AddForeignKey
ALTER TABLE "UserDiscussionCode" ADD CONSTRAINT "UserDiscussionCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenLog" ADD CONSTRAINT "TokenLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlanning" ADD CONSTRAINT "WeeklyPlanning_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPost" ADD CONSTRAINT "DraftPost_weeklyPlanningId_fkey" FOREIGN KEY ("weeklyPlanningId") REFERENCES "WeeklyPlanning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataImage" ADD CONSTRAINT "DataImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifyToken" ADD CONSTRAINT "VerifyToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResetToken" ADD CONSTRAINT "ResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicToken" ADD CONSTRAINT "MagicToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTask" ADD CONSTRAINT "ActionTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTask" ADD CONSTRAINT "ActionTask_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logo" ADD CONSTRAINT "logo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu" ADD CONSTRAINT "menu_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postrapide" ADD CONSTRAINT "postrapide_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

