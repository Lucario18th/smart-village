import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { SensorModule } from "../sensor/sensor.module";
import { MqttService } from "./mqtt.service";

@Module({
  imports: [ConfigModule, PrismaModule, SensorModule],
  providers: [MqttService],
})
export class MqttModule {}
