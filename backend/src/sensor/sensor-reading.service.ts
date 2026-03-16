import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class SensorReadingService {
  constructor(private readonly prisma: PrismaService) {}

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
    const where: any = { sensorId };
    if (from) where.ts = { ...(where.ts || {}), gte: new Date(from) };
    if (to) where.ts = { ...(where.ts || {}), lte: new Date(to) };

    return this.prisma.sensorReading.findMany({
      where,
      orderBy: { ts: order },
      take: limit,
    });
  }

  async timeseries(sensorId: number, from: string, to: string, bucket: string) {
    // Normalize bucket format: convert "1h" to "hour", "1d" to "day", etc.
    let bucketUnit = bucket.toLowerCase();
    bucketUnit = bucketUnit
      .replace(/^[0-9]+\s*(h|hour|hr)$/i, 'hour')
      .replace(/^[0-9]+\s*(d|day)$/i, 'day')
      .replace(/^[0-9]+\s*(m|minute|min)$/i, 'minute')
      .replace(/^[0-9]+\s*(s|second|sec)$/i, 'second')
      .replace(/^[0-9]+\s*(mon|month)$/i, 'month')
      .replace(/^[0-9]+\s*(y|year|yr)$/i, 'year');

    const rows: Array<{
      bucket_start: Date;
      value_min: number | null;
      value_max: number | null;
      value_avg: number | null;
      count: bigint;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        date_trunc($1, "ts") AS bucket_start,
        MIN("value") AS value_min,
        MAX("value") AS value_max,
        AVG("value") AS value_avg,
        COUNT(*)     AS count
      FROM "SensorReading"
      WHERE "sensorId" = $2
        AND "ts" >= $3
        AND "ts" <= $4
      GROUP BY bucket_start
      ORDER BY bucket_start ASC;
    `,
      bucketUnit,
      sensorId,
      new Date(from),
      new Date(to),
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
    const [agg] = await this.prisma.sensorReading.groupBy({
      by: ["sensorId"],
      where: {
        sensorId,
        ts: {
          gte: new Date(from),
          lte: new Date(to),
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
          gte: new Date(from),
          lte: new Date(to),
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
