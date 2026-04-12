-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'client';

-- AlterTable
ALTER TABLE "Preference" ADD COLUMN "logo_url" TEXT;
