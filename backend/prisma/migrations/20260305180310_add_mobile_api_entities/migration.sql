-- Add geo-coordinates to Sensor
ALTER TABLE "Sensor" ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

-- Create Message table
CREATE TABLE "Message" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "villageId" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "priority" VARCHAR(255) NOT NULL DEFAULT 'normal',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create RideShare table
CREATE TABLE "RideShare" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "villageId" INTEGER NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "personCount" INTEGER NOT NULL DEFAULT 0,
  "maxCapacity" INTEGER,
  "status" VARCHAR(255) NOT NULL DEFAULT 'active',
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RideShare_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village" ("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "Message_villageId_idx" ON "Message"("villageId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX "RideShare_villageId_idx" ON "RideShare"("villageId");
CREATE INDEX "RideShare_status_idx" ON "RideShare"("status");
CREATE INDEX "Sensor_villageId_idx" ON "Sensor"("villageId");

-- Add foreign key for Message
ALTER TABLE "Message" ADD CONSTRAINT "Message_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village" ("id") ON DELETE CASCADE;
