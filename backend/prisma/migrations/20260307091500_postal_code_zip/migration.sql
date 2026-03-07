-- Drop existing unique constraint
DROP INDEX IF EXISTS "PostalCode_postalCode_city_key";

-- Rename postalCode column to zipCode
ALTER TABLE "PostalCode" RENAME COLUMN "postalCode" TO "zipCode";

-- Ensure state is not null
UPDATE "PostalCode" SET "state" = COALESCE("state", 'Unbekannt');
ALTER TABLE "PostalCode" ALTER COLUMN "state" SET NOT NULL;

-- Drop obsolete coordinate columns
ALTER TABLE "PostalCode" DROP COLUMN IF EXISTS "lat";
ALTER TABLE "PostalCode" DROP COLUMN IF EXISTS "lng";

-- Create new unique constraint on zipCode
CREATE UNIQUE INDEX "PostalCode_zipCode_key" ON "PostalCode"("zipCode");
