import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SensorController } from "./sensor.controller";
import { SensorService } from "./sensor.service";
import { SensorReadingController } from "./sensor-reading.controller";
import { SensorReadingService } from "./sensor-reading.service";
import { SensorTypeController } from "./sensor-type.controller";

@Module({
  imports: [PrismaModule],
  controllers: [SensorController, SensorReadingController, SensorTypeController],
  providers: [SensorService, SensorReadingService],
  exports: [SensorService, SensorReadingService],
})
export class SensorModule {}
