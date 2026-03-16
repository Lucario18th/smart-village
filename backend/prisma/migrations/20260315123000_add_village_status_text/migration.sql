-- Add optional status text for village-level public status display
ALTER TABLE "Village"
ADD COLUMN "statusText" TEXT;
