// prisma/seed.js oder prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");

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
    // Freiburg / Region
    {
      zipCode: "79098",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
      lat: 47.9959,
      lng: 7.8522,
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
