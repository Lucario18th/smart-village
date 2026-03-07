const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

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

  await prisma.sensorType.deleteMany();
  await prisma.sensorType.createMany({ data: sensorTypes });

  console.log("✅ Seeded sensor types");
}

async function seedPostalCodes() {
  const postalCodes = [
    // Freiburg
    { zipCode: "79098", city: "Freiburg im Breisgau", state: "Baden-Württemberg", lat: 47.9959, lng: 7.8522 },
    { zipCode: "79100", city: "Freiburg im Breisgau", state: "Baden-Württemberg", lat: 47.9640, lng: 7.8570 },
    { zipCode: "79102", city: "Freiburg im Breisgau", state: "Baden-Württemberg", lat: 47.9910, lng: 7.8670 },
    { zipCode: "79104", city: "Freiburg im Breisgau", state: "Baden-Württemberg", lat: 48.0060, lng: 7.8780 },
    { zipCode: "79106", city: "Freiburg im Breisgau", state: "Baden-Württemberg", lat: 48.0070, lng: 7.8370 },
    { zipCode: "79108", city: "Freiburg im Breisgau", state: "Baden-Württemberg", lat: 48.0330, lng: 7.8570 },
    { zipCode: "79110", city: "Freiburg im Breisgau", state: "Baden-Württemberg", lat: 48.0190, lng: 7.8120 },
    { zipCode: "79111", city: "Freiburg im Breisgau", state: "Baden-Württemberg", lat: 47.9800, lng: 7.8120 },
    { zipCode: "79112", city: "Freiburg im Breisgau", state: "Baden-Württemberg", lat: 47.9570, lng: 7.7440 },

    // Neuenburg / Markgräflerland
    { zipCode: "79379", city: "Müllheim",             state: "Baden-Württemberg", lat: 47.8080, lng: 7.6340 },
    { zipCode: "79395", city: "Neuenburg am Rhein",   state: "Baden-Württemberg", lat: 47.8150, lng: 7.5650 },
    { zipCode: "79415", city: "Bad Bellingen",        state: "Baden-Württemberg", lat: 47.7350, lng: 7.5620 },
    { zipCode: "79423", city: "Heitersheim",          state: "Baden-Württemberg", lat: 47.8750, lng: 7.6530 },
    { zipCode: "79424", city: "Auggen",               state: "Baden-Württemberg", lat: 47.7850, lng: 7.5820 },
    { zipCode: "79426", city: "Buggingen",            state: "Baden-Württemberg", lat: 47.8640, lng: 7.6400 },
    { zipCode: "79427", city: "Eschbach",             state: "Baden-Württemberg", lat: 47.9180, lng: 7.6400 },

    // Weil / Rheinfelden / Grenzregion
    { zipCode: "79539", city: "Lörrach",              state: "Baden-Württemberg", lat: 47.6090, lng: 7.6646 },
    { zipCode: "79540", city: "Lörrach",              state: "Baden-Württemberg", lat: 47.6110, lng: 7.6820 },
    { zipCode: "79541", city: "Lörrach",              state: "Baden-Württemberg", lat: 47.5880, lng: 7.6870 },
    { zipCode: "79576", city: "Weil am Rhein",        state: "Baden-Württemberg", lat: 47.5900, lng: 7.6100 },
    { zipCode: "79585", city: "Steinen",              state: "Baden-Württemberg", lat: 47.6460, lng: 7.7400 },
    { zipCode: "79618", city: "Rheinfelden (Baden)",  state: "Baden-Württemberg", lat: 47.5580, lng: 7.7860 },

    // Schwarzwaldnähe / Umgebung
    { zipCode: "79219", city: "Staufen im Breisgau",  state: "Baden-Württemberg", lat: 47.8750, lng: 7.7320 },
    { zipCode: "79224", city: "Umkirch",              state: "Baden-Württemberg", lat: 48.0220, lng: 7.7630 },
    { zipCode: "79227", city: "Schallstadt",          state: "Baden-Württemberg", lat: 47.9580, lng: 7.7490 },
    { zipCode: "79232", city: "March",                state: "Baden-Württemberg", lat: 48.0500, lng: 7.8000 },
    { zipCode: "79241", city: "Ihringen",             state: "Baden-Württemberg", lat: 48.0470, lng: 7.6400 },
  ];

  await prisma.village.deleteMany(); // FK auf PostalCode
  await prisma.postalCode.deleteMany();
  await prisma.postalCode.createMany({ data: postalCodes });

  console.log("✅ Seeded postal codes with geo coords:", postalCodes.length);
}

async function seedTestAccounts() {
  const freiburg = await prisma.postalCode.findUnique({
    where: { zipCode: "79098" },
  });
  const loerrach = await prisma.postalCode.findUnique({
    where: { zipCode: "79539" },
  });

  const passwordHash = await bcrypt.hash("test1234", 10);

  await prisma.village.deleteMany();
  await prisma.account.deleteMany();

  const freiburgAccount = await prisma.account.create({
    data: {
      email: "freiburg@smart-village.local",
      passwordHash,
      isAdmin: true,
      emailVerified: true,
      villages: {
        create: {
          name: "Freiburg im Breisgau",
          locationName: "79098 Freiburg im Breisgau",
          municipalityCode: "79098-Freiburg im Breisgau",
          postalCodeId: freiburg?.id ?? null,
        },
      },
    },
  });

  const loerrachAccount = await prisma.account.create({
    data: {
      email: "loerrach@smart-village.local",
      passwordHash,
      isAdmin: false,
      emailVerified: true,
      villages: {
        create: {
          name: "Lörrach",
          locationName: "79539 Lörrach",
          municipalityCode: "79539-Lörrach",
          postalCodeId: loerrach?.id ?? null,
        },
      },
    },
  });

  console.log("✅ Seeded accounts:", freiburgAccount.email, loerrachAccount.email);
}

async function main() {
  console.log("🌱 Seeding database (with geo postal codes)...");
  await seedSensorTypes();
  await seedPostalCodes();
  await seedTestAccounts();
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
