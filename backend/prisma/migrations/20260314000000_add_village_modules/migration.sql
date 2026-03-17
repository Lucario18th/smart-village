-- CreateTable
CREATE TABLE "VillageModule" (
    "id" SERIAL NOT NULL,
    "villageId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VillageModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable (implicit many-to-many join table)
CREATE TABLE "_VillageModuleSensors" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_VillageModuleSensors_AB_unique" ON "_VillageModuleSensors" ("A", "B");

-- CreateIndex
CREATE INDEX "_VillageModuleSensors_B_index" ON "_VillageModuleSensors" ("B");

-- CreateIndex
CREATE INDEX "VillageModule_villageId_idx" ON "VillageModule" ("villageId");

-- AddForeignKey
ALTER TABLE "VillageModule"
ADD CONSTRAINT "VillageModule_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VillageModuleSensors"
ADD CONSTRAINT "_VillageModuleSensors_A_fkey" FOREIGN KEY ("A") REFERENCES "Sensor" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VillageModuleSensors"
ADD CONSTRAINT "_VillageModuleSensors_B_fkey" FOREIGN KEY ("B") REFERENCES "VillageModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE;