import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('sensor-types')
export class SensorTypeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listAll() {
    const types = await this.prisma.sensorType.findMany({
      orderBy: { name: 'asc' },
    })
    return types
  }
}
