#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const DEFAULT_RETENTION_DAYS = 90;

function parseRetentionDays(rawValue) {
  const parsed = Number.parseInt(String(rawValue || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_RETENTION_DAYS;
  }
  return parsed;
}

function buildCutoffDate(retentionDays) {
  const now = Date.now();
  const cutoffMs = now - retentionDays * 24 * 60 * 60 * 1000;
  return new Date(cutoffMs);
}

async function main() {
  const retentionArg = process.argv[2];
  const retentionDays = parseRetentionDays(
    retentionArg || process.env.SECURITY_INCIDENT_RETENTION_DAYS,
  );
  const apply = process.argv.includes("--apply");
  const cutoffDate = buildCutoffDate(retentionDays);

  const matchingRows = await prisma.securityIncident.count({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  if (!apply) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          retentionDays,
          cutoffIso: cutoffDate.toISOString(),
          wouldDelete: matchingRows,
          hint: "Run with --apply to delete matching incidents.",
        },
        null,
        2,
      ),
    );
    return;
  }

  const result = await prisma.securityIncident.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        dryRun: false,
        retentionDays,
        cutoffIso: cutoffDate.toISOString(),
        deleted: result.count,
      },
      null,
      2,
    ),
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
