const { PrismaClient, UserRole } = require("@prisma/client");
const { existsSync, readFileSync } = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

function parseCsv(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`CSV file not found at ${absolutePath}`);
  }
  const raw = readFileSync(absolutePath, "utf-8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const [headerLine, ...rows] = lines;
  const headers = headerLine.split(";").map((h) => h.trim());

  return rows.map((line) => {
    const values = line.split(";").map((value) => value.trim());
    const record = {};
    headers.forEach((key, index) => {
      record[key] = values[index] ?? "";
    });
    return record;
  });
}

async function seedSensorTypes() {
  const sensorTypes = [
    { name: "Temperature", unit: "°C", description: "Lufttemperatur" },
    { name: "Humidity", unit: "%", description: "Luftfeuchte" },
    { name: "Pressure", unit: "hPa", description: "Luftdruck" },
    { name: "Rainfall", unit: "mm", description: "Niederschlag" },
    { name: "Wind Speed", unit: "m/s", description: "Windgeschwindigkeit" },
    { name: "Solar Radiation", unit: "W/m²", description: "Solarstrahlung" },
    { name: "Soil Moisture", unit: "%", description: "Bodenfeuchte" },
    { name: "CO2", unit: "ppm", description: "Kohlendioxid-Konzentration" },
  ];

  for (const sensorType of sensorTypes) {
    await prisma.sensorType.upsert({
      where: { name: sensorType.name },
      update: {},
      create: sensorType,
    });
  }

  console.log("✅ Seeded sensor types");
}

async function seedPostalCodes() {
  const csvPath = path.join(__dirname, "filtered_data.csv");
  const records = parseCsv(csvPath);
  let count = 0;

  for (const record of records) {
    const zipCode = record.zipCode || record.plz;
    const city = record.city || record.ort;
    const state = record.state || record.bundesland || "Unbekannt";

    if (!zipCode || !city) continue;

    await prisma.postalCode.upsert({
      where: { zipCode },
      create: { zipCode, city, state },
      update: { city, state },
    });

    count += 1;
  }

  console.log(`✅ Seeded/updated ${count} postal codes`);
}

async function ensureSeedVillage(zipCode, city, state) {
  const postal = await prisma.postalCode.findUnique({ where: { zipCode } });
  if (!postal) {
    throw new Error(`Postal code ${zipCode} not found for city ${city}`);
  }

  const seedEmail = `${zipCode}-${city}@smart-village.local`.toLowerCase();
  const passwordHash = await bcrypt.hash("test1234", 10);

  const account = await prisma.account.upsert({
    where: { email: seedEmail },
    update: {},
    create: {
      email: seedEmail,
      passwordHash,
      emailVerified: true,
      isAdmin: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
      villages: {
        create: {
          name: city,
          locationName: `${zipCode} ${city}`,
          postalCodeId: postal.id,
          phone: "",
          infoText: "",
          contactEmail: seedEmail,
          contactPhone: "",
          municipalityCode: `${zipCode}-${city}`,
        },
      },
    },
    include: { villages: true },
  });

  return account.villages[0];
}

async function seedTestUsers() {
  const csvPath = path.join(__dirname, "test_users.csv");
  const records = parseCsv(csvPath);
  let count = 0;

  for (const record of records) {
    const email = record.email;
    const password = record.password || "test1234";

    const roleValue = (record.role || "VIEWER").toUpperCase();
    const isValidRole = roleValue in UserRole;
    const safeRole = isValidRole ? UserRole[roleValue] : UserRole.VIEWER;

    if (!isValidRole) {
      console.warn(
        `Unknown role '${roleValue}' for user ${email}, defaulting to VIEWER`
      );
    }

    const zipCode = record.zipCode || record.postalCode || record.plz;
    const city = record.city || record.ort || "";
    const state = record.state || record.bundesland || "Unbekannt";
    const displayName = record.displayName || city || email;

    if (!email || !zipCode || !city) continue;

    const village = await ensureSeedVillage(zipCode, city, state);
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        displayName,
        role: safeRole,
        villageId: village.id,
      },
      update: {
        displayName,
        role: safeRole,
        villageId: village.id,
        passwordHash,
      },
    });

    count += 1;
  }

  console.log(`✅ Seeded/updated ${count} test users`);
}

async function main() {
  console.log("🌱 Seeding database...");
  await seedSensorTypes();
  await seedPostalCodes();
  await seedTestUsers();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
