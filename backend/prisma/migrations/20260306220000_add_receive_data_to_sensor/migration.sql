-- Add receiveData flag to Sensor
ALTER TABLE "Sensor" ADD COLUMN "receiveData" BOOLEAN NOT NULL DEFAULT true;
