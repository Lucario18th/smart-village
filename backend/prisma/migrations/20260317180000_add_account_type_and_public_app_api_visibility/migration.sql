-- Add account classification and public app-api visibility controls
CREATE TYPE "AccountType" AS ENUM ('MUNICIPAL', 'PRIVATE');

ALTER TABLE "Account"
ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'MUNICIPAL',
ADD COLUMN "isPublicAppApiEnabled" BOOLEAN NOT NULL DEFAULT true;
