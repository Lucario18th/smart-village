// prisma/seed.js oder prisma/seed.cjs
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
    {
      name: "Mitfahrbank",
      unit: "Personen",
      description: "Anzahl wartender Personen an der Mitfahrbank",
    },
  ];

  for (const type of sensorTypes) {
    await prisma.sensorType.upsert({
      where: { name: type.name },
      update: {
        unit: type.unit,
        description: type.description,
      },
      create: type,
    });
  }

  console.log("✅ Seeded sensor types");
}

async function seedPostalCodes() {
  const postalCodes = [
    // Freiburg
    {
      zipCode: "79098",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 47.9959,
      lng: 7.8522,
    },
    {
      zipCode: "79100",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 47.964,
      lng: 7.857,
    },
    {
      zipCode: "79102",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 47.991,
      lng: 7.867,
    },
    {
      zipCode: "79104",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 48.006,
      lng: 7.878,
    },
    {
      zipCode: "79106",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 48.007,
      lng: 7.837,
    },
    {
      zipCode: "79108",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 48.033,
      lng: 7.857,
    },
    {
      zipCode: "79110",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 48.019,
      lng: 7.812,
    },
    {
      zipCode: "79111",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 47.98,
      lng: 7.812,
    },
    {
      zipCode: "79112",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 47.957,
      lng: 7.744,
    },

    // Neuenburg / Markgräflerland
    {
      zipCode: "79379",
      city: "Müllheim",
      state: "Baden-Württemberg",
      lat: 47.808,
      lng: 7.634,
    },
    {
      zipCode: "79395",
      city: "Neuenburg am Rhein",
      state: "Baden-Württemberg",
      lat: 47.815,
      lng: 7.565,
    },
    {
      zipCode: "79415",
      city: "Bad Bellingen",
      state: "Baden-Württemberg",
      lat: 47.735,
      lng: 7.562,
    },
    {
      zipCode: "79423",
      city: "Heitersheim",
      state: "Baden-Württemberg",
      lat: 47.875,
      lng: 7.653,
    },
    {
      zipCode: "79424",
      city: "Auggen",
      state: "Baden-Württemberg",
      lat: 47.785,
      lng: 7.582,
    },
    {
      zipCode: "79426",
      city: "Buggingen",
      state: "Baden-Württemberg",
      lat: 47.864,
      lng: 7.64,
    },
    {
      zipCode: "79427",
      city: "Eschbach",
      state: "Baden-Württemberg",
      lat: 47.918,
      lng: 7.64,
    },

    // Weil / Rheinfelden / Grenzregion
    {
      zipCode: "79539",
      city: "Lörrach",
      state: "Baden-Württemberg",
      lat: 47.609,
      lng: 7.6646,
    },
    {
      zipCode: "79540",
      city: "Lörrach",
      state: "Baden-Württemberg",
      lat: 47.611,
      lng: 7.682,
    },
    {
      zipCode: "79541",
      city: "Lörrach",
      state: "Baden-Württemberg",
      lat: 47.588,
      lng: 7.687,
    },
    {
      zipCode: "79576",
      city: "Weil am Rhein",
      state: "Baden-Württemberg",
      lat: 47.59,
      lng: 7.61,
    },
    {
      zipCode: "79585",
      city: "Steinen",
      state: "Baden-Württemberg",
      lat: 47.646,
      lng: 7.74,
    },
    {
      zipCode: "79618",
      city: "Rheinfelden (Baden)",
      state: "Baden-Württemberg",
      lat: 47.558,
      lng: 7.786,
    },

    // Schwarzwaldnähe / Umgebung
    {
      zipCode: "79219",
      city: "Staufen im Breisgau",
      state: "Baden-Württemberg",
      lat: 47.875,
      lng: 7.732,
    },
    {
      zipCode: "79224",
      city: "Umkirch",
      state: "Baden-Württemberg",
      lat: 48.022,
      lng: 7.763,
    },
    {
      zipCode: "79227",
      city: "Schallstadt",
      state: "Baden-Württemberg",
      lat: 47.958,
      lng: 7.749,
    },
    {
      zipCode: "79232",
      city: "March",
      state: "Baden-Württemberg",
      lat: 48.05,
      lng: 7.8,
    },
    {
      zipCode: "79241",
      city: "Ihringen",
      state: "Baden-Württemberg",
      lat: 48.047,
      lng: 7.64,
    },
  ];

  for (const pc of postalCodes) {
    await prisma.postalCode.upsert({
      where: { zipCode: pc.zipCode },
      update: {
        city: pc.city,
        state: pc.state,
        lat: pc.lat,
        lng: pc.lng,
      },
      create: pc,
    });
  }

  console.log("✅ Seeded postal codes");
}

async function seedAccountsAndVillages() {
  const passwordHash = await bcrypt.hash("test1234", 10);

  const freiburgPc = await prisma.postalCode.findUnique({
    where: { zipCode: "79098" },
  });
  const loerrachPc = await prisma.postalCode.findUnique({
    where: { zipCode: "79539" },
  });
  const buggingenPc = await prisma.postalCode.findUnique({
    where: { zipCode: "79426" },
  });

  const freiburgAccount = await prisma.account.upsert({
    where: { email: "freiburg@smart-village.local" },
    update: {},
    create: {
      email: "freiburg@smart-village.local",
      passwordHash,
      isAdmin: true,
      emailVerified: true,
      villages: {
        create: {
          name: "Freiburg im Breisgau",
          locationName: "79098 Freiburg im Breisgau",
          municipalityCode: "79098-Freiburg im Breisgau",
          postalCodeId: freiburgPc ? freiburgPc.id : null,
        },
      },
    },
  });

  const loerrachAccount = await prisma.account.upsert({
    where: { email: "loerrach@smart-village.local" },
    update: {},
    create: {
      email: "loerrach@smart-village.local",
      passwordHash,
      isAdmin: false,
      emailVerified: true,
      villages: {
        create: {
          name: "Lörrach",
          locationName: "79539 Lörrach",
          municipalityCode: "79539-Lörrach",
          postalCodeId: loerrachPc ? loerrachPc.id : null,
        },
      },
    },
  });

  const buggingenAccount = await prisma.account.upsert({
    where: { email: "buggingen@smart-village.local" },
    update: {},
    create: {
      email: "buggingen@smart-village.local",
      passwordHash,
      isAdmin: false,
      emailVerified: true,
      villages: {
        create: {
          name: "Buggingen",
          locationName: "79426 Buggingen",
          municipalityCode: "79426-Buggingen",
          postalCodeId: buggingenPc ? buggingenPc.id : null,
        },
      },
    },
  });

  console.log(
    "✅ Seeded accounts:",
    freiburgAccount.email,
    loerrachAccount.email,
    buggingenAccount.email
  );
}

async function seedVillageFeatures() {
  const villages = await prisma.village.findMany({ select: { id: true } });

  for (const village of villages) {
    await prisma.villageFeatures.upsert({
      where: { villageId: village.id },
      update: {},
      create: {
        villageId: village.id,
        enableSensorData: true,
        enableWeather: true,
        enableMessages: true,
        enableEvents: true,
        enableMap: true,
        enableRideShare: true,
        enableTextileContainers: true,
        showSensorName: true,
        showSensorType: true,
        showSensorDescription: true,
        showSensorCoordinates: true,
      },
    });
  }

  console.log("✅ Seeded VillageFeatures for", villages.length, "villages");
}

async function main() {
  console.log("🌱 Seeding database (JS)...");
  await seedSensorTypes();
  await seedPostalCodes();
  await seedAccountsAndVillages();
  await seedVillageFeatures();
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
