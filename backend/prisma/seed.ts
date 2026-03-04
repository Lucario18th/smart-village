import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed SensorTypes
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
    const existing = await prisma.sensorType.findFirst({
      where: { name: sensorType.name },
    });

    if (!existing) {
      await prisma.sensorType.create({
        data: sensorType,
      });
      console.log(`✅ Created SensorType: ${sensorType.name}`);
    } else {
      console.log(`⏭️  SensorType already exists: ${sensorType.name}`);
    }
  }

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
