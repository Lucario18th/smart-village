import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { SensorReadingService } from "./sensor-reading.service";

@Controller("sensor-readings")
export class SensorReadingController {
  constructor(private readonly service: SensorReadingService) {}

  private parseLimit(limitStr?: string): number {
    if (!limitStr) {
      return 1000;
    }

    const limit = Number.parseInt(limitStr, 10);
    if (Number.isNaN(limit) || limit <= 0) {
      throw new BadRequestException("limit must be a positive integer");
    }

    return Math.min(limit, 5000);
  }

  @Post("/:sensorId")
  async create(
    @Param("sensorId", ParseIntPipe) sensorId: number,
    @Body() body: any,
  ) {
    let readings: Array<{
      ts: string;
      value: number;
      status?: string;
      extra?: unknown;
    }> = [];

    if (Array.isArray(body.readings)) {
      readings = body.readings;
    } else if (body.ts && body.value !== undefined) {
      readings = [body];
    } else {
      throw new BadRequestException(
        "Invalid body, expected { ts, value } or { readings: [...] }",
      );
    }

    return this.service.createReadings(sensorId, readings);
  }

  @Get("/:sensorId")
  list(
    @Param("sensorId", ParseIntPipe) sensorId: number,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limitStr?: string,
    @Query("order") order?: "asc" | "desc",
  ) {
    const limit = this.parseLimit(limitStr);
    if (order && order !== "asc" && order !== "desc") {
      throw new BadRequestException("order must be asc or desc");
    }

    return this.service.listReadings(
      sensorId,
      from,
      to,
      limit,
      order ?? "desc",
    );
  }

  @Get("/:sensorId/timeseries")
  timeseries(
    @Param("sensorId", ParseIntPipe) sensorId: number,
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("bucket") bucket: string,
  ) {
    if (!from || !to || !bucket) {
      throw new BadRequestException("from, to and bucket are required");
    }

    return this.service.timeseries(sensorId, from, to, bucket);
  }

  @Get("/:sensorId/summary")
  summary(
    @Param("sensorId", ParseIntPipe) sensorId: number,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException("from and to are required");
    }

    return this.service.summary(sensorId, from, to);
  }
}
