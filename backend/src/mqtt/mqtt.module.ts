import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SensorModule } from "../sensor/sensor.module";
import { MqttService } from "./mqtt.service";

@Module({
  imports: [PrismaModule, SensorModule],
  providers: [MqttService],
})
export class MqttModule {}
