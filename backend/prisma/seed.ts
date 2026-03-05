import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed test user
  const testUserEmail = 'test@example.com';
  const existingUser = await prisma.account.findUnique({
    where: { email: testUserEmail },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);
    
    await prisma.account.create({
      data: {
        email: testUserEmail,
        passwordHash,
        villages: {
          create: {
            name: "Test Village",
            locationName: "Test Location",
            phone: "+49 123 456789",
            infoText: "Test village for development",
            contactEmail: testUserEmail,
            contactPhone: "+49 123 456789",
            municipalityCode: "12345",
          },
        },
      },
    });
    console.log(`✅ Created test user: ${testUserEmail}`);
  } else {
    console.log(`⏭️  Test user already exists: ${testUserEmail}`);
  }

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
