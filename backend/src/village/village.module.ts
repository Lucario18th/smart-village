import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SensorService } from '../sensor/sensor.service'
import { VillageController } from './village.controller'

@Module({
  controllers: [VillageController],
  providers: [PrismaService, SensorService],
})
export class VillageModule {}
