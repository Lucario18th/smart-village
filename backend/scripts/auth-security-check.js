#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const action = process.argv[2];

async function resetAdminState() {
  const email = process.argv[3] || "freiburg@smart-village.local";
  await prisma.account.update({
    where: { email },
    data: {
      activeAdminSessionId: null,
      activeAdminSessionExpiresAt: null,
      activeAdminSessionIp: null,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
  });

  const row = await prisma.account.findUnique({
    where: { email },
    select: {
      email: true,
      failedLoginAttempts: true,
      lockUntil: true,
      activeAdminSessionId: true,
      activeAdminSessionExpiresAt: true,
      activeAdminSessionIp: true,
    },
  });

  console.log(JSON.stringify(row, null, 2));
}

async function listIncidents() {
  const take = Number.parseInt(process.argv[3] || "20", 10);
  const rows = await prisma.securityIncident.findMany({
    take: Number.isFinite(take) && take > 0 ? take : 20,
    orderBy: { createdAt: "desc" },
    select: {
      type: true,
      success: true,
      reason: true,
      email: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  });

  console.log(JSON.stringify(rows, null, 2));
}

async function main() {
  if (action === "reset-admin") {
    await resetAdminState();
    return;
  }

  if (action === "incidents") {
    await listIncidents();
    return;
  }

  throw new Error(
    "Usage: node scripts/auth-security-check.js <reset-admin|incidents> [args]",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
