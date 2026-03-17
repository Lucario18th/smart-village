-- Fix: _VillageModuleSensors join table had A→VillageModule and B→Sensor,
-- but Prisma's implicit many-to-many requires A→Sensor (alphabetically first)
-- and B→VillageModule. Rebuild the table with correct FK assignments.

DROP TABLE IF EXISTS "_VillageModuleSensors";

CREATE TABLE "_VillageModuleSensors" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "_VillageModuleSensors_AB_unique" ON "_VillageModuleSensors" ("A", "B");
CREATE INDEX "_VillageModuleSensors_B_index" ON "_VillageModuleSensors" ("B");

-- A → Sensor (alphabetically first: S < V)
ALTER TABLE "_VillageModuleSensors"
  ADD CONSTRAINT "_VillageModuleSensors_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Sensor" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- B → VillageModule
ALTER TABLE "_VillageModuleSensors"
  ADD CONSTRAINT "_VillageModuleSensors_B_fkey"
  FOREIGN KEY ("B") REFERENCES "VillageModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
