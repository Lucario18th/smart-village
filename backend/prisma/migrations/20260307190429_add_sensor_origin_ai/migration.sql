-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECH', 'VIEWER');

-- CreateEnum
CREATE TYPE "SensorHealthStatus" AS ENUM ('OK', 'WARN', 'ERROR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('OK', 'SUSPECT', 'ERROR');

-- CreateEnum
CREATE TYPE "SensorOrigin" AS ENUM ('HARDWARE', 'AI_SERVICE');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verificationCodeExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Village" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "postalCodeId" INTEGER,
    "name" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "phone" TEXT,
    "infoText" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "municipalityCode" TEXT,

    CONSTRAINT "Village_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostalCode" (
    "id" SERIAL NOT NULL,
    "zipCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "PostalCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "villageId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "infoText" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SensorType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" SERIAL NOT NULL,
    "villageId" INTEGER NOT NULL,
    "deviceId" INTEGER,
    "sensorTypeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "infoText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "receiveData" BOOLEAN NOT NULL DEFAULT true,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "origin" "SensorOrigin" NOT NULL DEFAULT 'HARDWARE',
    "aiProvider" TEXT,
    "aiModelName" TEXT,
    "aiConfigJson" JSONB,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorStatus" (
    "id" SERIAL NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "status" "SensorHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "message" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" SERIAL NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'OK',
    "extra" JSONB,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "villageId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideShare" (
    "id" SERIAL NOT NULL,
    "villageId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "personCount" INTEGER NOT NULL DEFAULT 0,
    "maxCapacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "villageId" INTEGER NOT NULL,
    "name" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Village_accountId_idx" ON "Village"("accountId");

-- CreateIndex
CREATE INDEX "Village_postalCodeId_idx" ON "Village"("postalCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "PostalCode_zipCode_key" ON "PostalCode"("zipCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SensorType_name_key" ON "SensorType"("name");

-- CreateIndex
CREATE INDEX "Sensor_villageId_idx" ON "Sensor"("villageId");

-- CreateIndex
CREATE INDEX "Sensor_deviceId_idx" ON "Sensor"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "SensorStatus_sensorId_key" ON "SensorStatus"("sensorId");

-- CreateIndex
CREATE INDEX "SensorReading_sensorId_ts_idx" ON "SensorReading"("sensorId", "ts");

-- CreateIndex
CREATE INDEX "SensorReading_ts_idx" ON "SensorReading"("ts");

-- CreateIndex
CREATE INDEX "Message_villageId_idx" ON "Message"("villageId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "RideShare_villageId_idx" ON "RideShare"("villageId");

-- CreateIndex
CREATE INDEX "RideShare_status_idx" ON "RideShare"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE INDEX "Device_villageId_idx" ON "Device"("villageId");

-- AddForeignKey
ALTER TABLE "Village" ADD CONSTRAINT "Village_postalCodeId_fkey" FOREIGN KEY ("postalCodeId") REFERENCES "PostalCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Village" ADD CONSTRAINT "Village_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_sensorTypeId_fkey" FOREIGN KEY ("sensorTypeId") REFERENCES "SensorType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorStatus" ADD CONSTRAINT "SensorStatus_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideShare" ADD CONSTRAINT "RideShare_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE CASCADE ON UPDATE CASCADE;
