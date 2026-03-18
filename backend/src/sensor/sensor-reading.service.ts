import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

const ALLOWED_BUCKET_UNITS = new Set([
  "second",
  "minute",
  "hour",
  "day",
  "month",
  "year",
]);

@Injectable()
export class SensorReadingService {
  constructor(private readonly prisma: PrismaService) {}

  private toValidDate(input: string, fieldName: string): Date {
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date`);
    }
    return parsed;
  }

  private normalizeBucket(bucket: string): string {
    const normalized = bucket
      .toLowerCase()
      .replace(/^[0-9]+\s*(h|hour|hr)$/i, "hour")
      .replace(/^[0-9]+\s*(d|day)$/i, "day")
      .replace(/^[0-9]+\s*(m|minute|min)$/i, "minute")
      .replace(/^[0-9]+\s*(s|second|sec)$/i, "second")
      .replace(/^[0-9]+\s*(mon|month)$/i, "month")
      .replace(/^[0-9]+\s*(y|year|yr)$/i, "year");

    if (!ALLOWED_BUCKET_UNITS.has(normalized)) {
      throw new BadRequestException("Unsupported bucket value");
    }

    return normalized;
  }

  async createReadings(
    sensorId: number,
    readings: Array<{
      ts: string;
      value: number;
      status?: string;
      extra?: unknown;
    }>,
  ) {
    const mapped: Prisma.SensorReadingCreateManyInput[] = readings.map((r) => ({
      sensorId,
      ts: new Date(r.ts),
      value: r.value,
      status: (r.status as any) ?? "OK",
      extra: (r.extra as Prisma.InputJsonValue) ?? Prisma.JsonNull, // <- wichtig
    }));

    await this.prisma.sensorReading.createMany({
      data: mapped,
    });

    return { created: mapped.length };
  }

  listReadings(
    sensorId: number,
    from?: string,
    to?: string,
    limit = 1000,
    order: "asc" | "desc" = "desc",
  ) {
    const where: Prisma.SensorReadingWhereInput = { sensorId };
    const tsFilter: Prisma.DateTimeFilter = {};
    if (from) tsFilter.gte = this.toValidDate(from, "from");
    if (to) tsFilter.lte = this.toValidDate(to, "to");
    if (Object.keys(tsFilter).length > 0) {
      where.ts = tsFilter;
    }

    return this.prisma.sensorReading.findMany({
      where,
      orderBy: { ts: order },
      take: limit,
    });
  }

  async timeseries(sensorId: number, from: string, to: string, bucket: string) {
    const bucketUnit = this.normalizeBucket(bucket);
    const fromDate = this.toValidDate(from, "from");
    const toDate = this.toValidDate(to, "to");

    const rows: Array<{
      bucket_start: Date;
      value_min: number | null;
      value_max: number | null;
      value_avg: number | null;
      count: bigint;
    }> = await this.prisma.$queryRaw(
      Prisma.sql`
      SELECT
        date_trunc(${bucketUnit}, "ts") AS bucket_start,
        MIN("value") AS value_min,
        MAX("value") AS value_max,
        AVG("value") AS value_avg,
        COUNT(*)     AS count
      FROM "SensorReading"
      WHERE "sensorId" = ${sensorId}
        AND "ts" >= ${fromDate}
        AND "ts" <= ${toDate}
      GROUP BY bucket_start
      ORDER BY bucket_start ASC;
    `,
    );

    return rows.map((r) => ({
      bucketStart: r.bucket_start,
      valueMin: r.value_min,
      valueMax: r.value_max,
      valueAvg: r.value_avg,
      count: Number(r.count),
    }));
  }

  async summary(sensorId: number, from: string, to: string) {
    const fromDate = this.toValidDate(from, "from");
    const toDate = this.toValidDate(to, "to");

    const [agg] = await this.prisma.sensorReading.groupBy({
      by: ["sensorId"],
      where: {
        sensorId,
        ts: {
          gte: fromDate,
          lte: toDate,
        },
      },
      _min: { value: true },
      _max: { value: true },
      _avg: { value: true },
      _count: { _all: true },
    });

    const last = await this.prisma.sensorReading.findFirst({
      where: {
        sensorId,
        ts: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { ts: "desc" },
    });

    return {
      from,
      to,
      min: agg?._min.value ?? null,
      max: agg?._max.value ?? null,
      avg: agg?._avg.value ?? null,
      count: agg?._count._all ?? 0,
      last: last ? last.value : null,
      lastTimestamp: last ? last.ts : null,
    };
  }
}
