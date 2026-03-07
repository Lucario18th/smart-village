import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Row = {
  zipCode: string;
  city: string;
  state?: string;
};

function parseCsv(filePath: string): Row[] {
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows: Row[] = [];

  for (const line of lines) {
    const [zipCode, city, state] = line.split(";").map((field) => field?.trim() ?? "");
    if (!zipCode || !city || zipCode.toLowerCase() === "plz") {
      continue;
    }

    rows.push({
      zipCode,
      city,
      state: state || "Unbekannt",
    });
  }

  return rows;
}

async function importPostalCodes(filePath: string) {
  const absolutePath = resolve(filePath);
  console.log(`📥 Loading postal codes from ${absolutePath}`);

  const rows = parseCsv(absolutePath);
  console.log(`➡️  Parsed ${rows.length} rows`);

  let imported = 0;
  for (const row of rows) {
    await prisma.postalCode.upsert({
      where: {
        zipCode: row.zipCode,
      },
      update: {
        state: row.state,
      },
      create: row,
    });
    imported += 1;
  }

  console.log(`✅ Imported/updated ${imported} postal codes`);
}

async function main() {
  const [, , fileArg] = process.argv;

  if (!fileArg) {
    console.error("❌ Please provide the path to a CSV file: npm run seed:postal-codes -- ./data/plz.csv");
    process.exit(1);
  }

  await importPostalCodes(fileArg);
}

main()
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
