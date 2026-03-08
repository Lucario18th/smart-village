// prisma/seed.js oder prisma/seed.cjs
const { PrismaClient, SensorOrigin } = require("@prisma/client");
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

function nowMinusMinutes(min) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - min);
  return d;
}

async function seedDevicesAndSensors() {
  const villages = await prisma.village.findMany();
  const freiburg = villages.find((v) =>
    v.name.includes("Freiburg im Breisgau")
  );
  const loerrach = villages.find((v) => v.name.includes("Lörrach"));
  const buggingen = villages.find((v) => v.name.includes("Buggingen"));

  const tempType = await prisma.sensorType.findUnique({
    where: { name: "Temperature" },
  });
  const humidityType = await prisma.sensorType.findUnique({
    where: { name: "Humidity" },
  });
  const pressureType = await prisma.sensorType.findUnique({
    where: { name: "Pressure" },
  });
  const rainType = await prisma.sensorType.findUnique({
    where: { name: "Rainfall" },
  });
  const windType = await prisma.sensorType.findUnique({
    where: { name: "Wind Speed" },
  });
  const solarType = await prisma.sensorType.findUnique({
    where: { name: "Solar Radiation" },
  });
  const soilType = await prisma.sensorType.findUnique({
    where: { name: "Soil Moisture" },
  });
  const co2Type = await prisma.sensorType.findUnique({
    where: { name: "CO2" },
  });
  const mitfahrbankType = await prisma.sensorType.findUnique({
    where: { name: "Mitfahrbank" },
  });

  async function createWeatherStationCluster(opts) {
    const device = await prisma.device.upsert({
      where: { deviceId: opts.deviceId },
      update: {
        name: opts.name,
        villageId: opts.villageId,
        latitude: opts.lat,
        longitude: opts.lng,
      },
      create: {
        deviceId: opts.deviceId,
        name: opts.name,
        villageId: opts.villageId,
        latitude: opts.lat,
        longitude: opts.lng,
      },
    });

    const base = {
      villageId: opts.villageId,
      deviceId: device.id,
      isActive: true,
      receiveData: true,
      exposeToApp: true,
      latitude: opts.lat,
      longitude: opts.lng,
      origin: SensorOrigin.HARDWARE,
    };

    const data = [];

    if (tempType) {
      data.push({
        sensorTypeId: tempType.id,
        name: "Temperatur",
        infoText: "Lufttemperatur",
        ...base,
      });
    }
    if (humidityType) {
      data.push({
        sensorTypeId: humidityType.id,
        name: "Luftfeuchte",
        infoText: "Relative Luftfeuchtigkeit",
        ...base,
      });
    }
    if (pressureType) {
      data.push({
        sensorTypeId: pressureType.id,
        name: "Luftdruck",
        infoText: "Luftdruck auf Stationshöhe",
        ...base,
      });
    }
    if (rainType) {
      data.push({
        sensorTypeId: rainType.id,
        name: "Niederschlag",
        infoText: "Niederschlag letzte Stunde",
        ...base,
      });
    }
    if (windType) {
      data.push({
        sensorTypeId: windType.id,
        name: "Wind",
        infoText: "Windgeschwindigkeit",
        ...base,
      });
    }
    if (solarType) {
      data.push({
        sensorTypeId: solarType.id,
        name: "Solarstrahlung",
        infoText: "Einstrahlung auf horizontaler Fläche",
        ...base,
      });
    }
    if (soilType) {
      data.push({
        sensorTypeId: soilType.id,
        name: "Bodenfeuchte",
        infoText: "Bodenfeuchtigkeit im Grünbereich",
        ...base,
      });
    }
    if (co2Type) {
      data.push({
        sensorTypeId: co2Type.id,
        name: "CO₂",
        infoText: "CO₂ Konzentration",
        ...base,
      });
    }

    if (data.length > 0) {
      await prisma.sensor.createMany({
        data,
        skipDuplicates: true,
      });
    }
  }

  async function createMitfahrbankCluster(opts) {
    if (!mitfahrbankType) return;

    const sensors = [];
    for (let i = 0; i < opts.count; i++) {
      const device = await prisma.device.upsert({
        where: { deviceId: `${opts.baseDeviceId}-${i + 1}` },
        update: {
          villageId: opts.villageId,
          name: `${opts.baseName} #${i + 1}`,
          latitude: opts.baseLat + i * 0.0015,
          longitude: opts.baseLng + i * 0.0015,
        },
        create: {
          deviceId: `${opts.baseDeviceId}-${i + 1}`,
          villageId: opts.villageId,
          name: `${opts.baseName} #${i + 1}`,
          latitude: opts.baseLat + i * 0.0015,
          longitude: opts.baseLng + i * 0.0015,
        },
      });

      sensors.push({
        villageId: opts.villageId,
        deviceId: device.id,
        sensorTypeId: mitfahrbankType.id,
        name: "Mitfahrbank",
        infoText:
          "Anzahl wartender Personen an der Mitfahrbank (AI-Erkennung)",
        isActive: true,
        receiveData: true,
        exposeToApp: true,
        latitude: device.latitude,
        longitude: device.longitude,
        origin: SensorOrigin.AI_SERVICE,
        aiProvider: "Mitfahrbank Vision AI",
        aiModelName: "people-counting-v1",
      });
    }

    if (sensors.length > 0) {
      await prisma.sensor.createMany({
        data: sensors,
        skipDuplicates: true,
      });
    }
  }

  if (freiburg) {
    await createWeatherStationCluster({
      villageId: freiburg.id,
      deviceId: "gw-fr-dev-1",
      name: "Freiburg Innenstadt Wetterstation",
      lat: 47.9959,
      lng: 7.8522,
    });
    await createWeatherStationCluster({
      villageId: freiburg.id,
      deviceId: "gw-fr-dev-2",
      name: "Freiburg Rieselfeld Wetterstation",
      lat: 47.989,
      lng: 7.805,
    });
    await createMitfahrbankCluster({
      villageId: freiburg.id,
      baseDeviceId: "gw-fr-mitfahrbank",
      baseName: "Freiburg Mitfahrbank",
      baseLat: 47.99,
      baseLng: 7.85,
      count: 4,
    });
  }

  if (loerrach) {
    await createWeatherStationCluster({
      villageId: loerrach.id,
      deviceId: "gw-loe-dev-1",
      name: "Lörrach Stadtpark Wetterstation",
      lat: 47.609,
      lng: 7.6646,
    });
    await createMitfahrbankCluster({
      villageId: loerrach.id,
      baseDeviceId: "gw-loe-mitfahrbank",
      baseName: "Lörrach Mitfahrbank",
      baseLat: 47.61,
      baseLng: 7.66,
      count: 3,
    });
  }

  if (buggingen) {
    await createWeatherStationCluster({
      villageId: buggingen.id,
      deviceId: "gw-v3-dev-3",
      name: "Buggingen Wetterstation",
      lat: 47.9999,
      lng: 7.8562,
    });
    await createMitfahrbankCluster({
      villageId: buggingen.id,
      baseDeviceId: "gw-v3-mitfahrbank",
      baseName: "Mitfahrbank Buggingen",
      baseLat: 47.864,
      baseLng: 7.64,
      count: 5,
    });
  }

  console.log("✅ Seeded devices and sensors (JS)");
}

async function main() {
  console.log("🌱 Seeding database (JS)...");
  await seedSensorTypes();
  await seedPostalCodes();
  await seedAccountsAndVillages();
  await seedVillageFeatures();
  await seedDevicesAndSensors();
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
