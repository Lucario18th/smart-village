DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Device'
  ) THEN
    CREATE TABLE "Device" (
      "id" SERIAL PRIMARY KEY,
      "deviceId" TEXT NOT NULL,
      "villageId" INTEGER NOT NULL,
      "name" TEXT,
      "latitude" DOUBLE PRECISION,
      "longitude" DOUBLE PRECISION
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Device_deviceId_key" ON "Device"("deviceId");
CREATE INDEX IF NOT EXISTS "Device_villageId_idx" ON "Device"("villageId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Village'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Device_villageId_fkey'
  ) THEN
    ALTER TABLE "Device"
      ADD CONSTRAINT "Device_villageId_fkey"
      FOREIGN KEY ("villageId") REFERENCES "Village"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Sensor'
      AND column_name = 'deviceId'
  ) THEN
    ALTER TABLE "Sensor" ADD COLUMN "deviceId" INTEGER;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Sensor_deviceId_idx" ON "Sensor"("deviceId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Device'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Sensor_deviceId_fkey'
  ) THEN
    ALTER TABLE "Sensor"
      ADD CONSTRAINT "Sensor_deviceId_fkey"
      FOREIGN KEY ("deviceId") REFERENCES "Device"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;