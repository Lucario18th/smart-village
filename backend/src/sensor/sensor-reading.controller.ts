import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { SensorReadingService } from './sensor-reading.service';

@Controller('sensor-readings')
export class SensorReadingController {
  constructor(private readonly service: SensorReadingService) {}

  @Post('/:sensorId')
  async create(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Body() body: any,
  ) {
    let readings: Array<{ ts: string; value: number; status?: string; extra?: unknown }> = [];

    if (Array.isArray(body.readings)) {
      readings = body.readings;
    } else if (body.ts && body.value !== undefined) {
      readings = [body];
    } else {
      throw new Error('Invalid body, expected { ts, value } or { readings: [...] }');
    }

    return this.service.createReadings(sensorId, readings);
  }

  @Get('/:sensorId')
  list(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limitStr?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 1000;
    return this.service.listReadings(sensorId, from, to, limit, order ?? 'desc');
  }

  @Get('/:sensorId/timeseries')
  timeseries(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('bucket') bucket: string,
  ) {
    return this.service.timeseries(sensorId, from, to, bucket);
  }

  @Get('/:sensorId/summary')
  summary(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.summary(sensorId, from, to);
  }
}
