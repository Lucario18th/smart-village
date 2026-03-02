import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SensorController } from './sensor.controller';
import { SensorService } from './sensor.service';
import { SensorReadingController } from './sensor-reading.controller';
import { SensorReadingService } from './sensor-reading.service';

@Module({
  imports: [PrismaModule],
  controllers: [SensorController, SensorReadingController],
  providers: [SensorService, SensorReadingService],
})
export class SensorModule {}
