-- CreateTable
CREATE TABLE "PostalCode" (
    "id" SERIAL NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "PostalCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostalCode_postalCode_city_key" ON "PostalCode"("postalCode", "city");

-- AlterTable
ALTER TABLE "Village" ADD COLUMN     "postalCodeId" INTEGER;

-- CreateIndex
CREATE INDEX "Village_postalCodeId_idx" ON "Village"("postalCodeId");

-- AddForeignKey
ALTER TABLE "Village" ADD CONSTRAINT "Village_postalCodeId_fkey" FOREIGN KEY ("postalCodeId") REFERENCES "PostalCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
