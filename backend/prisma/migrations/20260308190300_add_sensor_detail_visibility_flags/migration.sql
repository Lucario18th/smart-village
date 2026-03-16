-- AlterTable
ALTER TABLE "VillageFeatures" ADD COLUMN "showSensorName" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "VillageFeatures" ADD COLUMN "showSensorType" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "VillageFeatures" ADD COLUMN "showSensorDescription" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "VillageFeatures" ADD COLUMN "showSensorCoordinates" BOOLEAN NOT NULL DEFAULT true;
