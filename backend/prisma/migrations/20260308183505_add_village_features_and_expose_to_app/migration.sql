-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "exposeToApp" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VillageFeatures" (
    "id" SERIAL NOT NULL,
    "villageId" INTEGER NOT NULL,
    "enableSensorData" BOOLEAN NOT NULL DEFAULT true,
    "enableWeather" BOOLEAN NOT NULL DEFAULT true,
    "enableMessages" BOOLEAN NOT NULL DEFAULT true,
    "enableEvents" BOOLEAN NOT NULL DEFAULT false,
    "enableMap" BOOLEAN NOT NULL DEFAULT true,
    "enableRideShare" BOOLEAN NOT NULL DEFAULT true,
    "enableTextileContainers" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VillageFeatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VillageFeatures_villageId_key" ON "VillageFeatures"("villageId");

-- AddForeignKey
ALTER TABLE "VillageFeatures" ADD CONSTRAINT "VillageFeatures_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE CASCADE ON UPDATE CASCADE;
