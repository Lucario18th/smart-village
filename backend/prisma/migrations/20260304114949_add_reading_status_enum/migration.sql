-- Create ReadingStatus enum type
CREATE TYPE "ReadingStatus" AS ENUM ('OK', 'SUSPECT', 'ERROR');

-- Update SensorReading status column to use the enum type
ALTER TABLE "SensorReading" 
ALTER COLUMN "status" TYPE "ReadingStatus" USING 
  CASE 
    WHEN "status" = 'OK' THEN 'OK'::"ReadingStatus"
    WHEN "status" = 'SUSPECT' THEN 'SUSPECT'::"ReadingStatus"
    WHEN "status" = 'ERROR' THEN 'ERROR'::"ReadingStatus"
    ELSE 'OK'::"ReadingStatus"
  END;

-- Set default value for status column
ALTER TABLE "SensorReading" 
ALTER COLUMN "status" SET DEFAULT 'OK'::"ReadingStatus";
