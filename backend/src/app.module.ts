import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { SensorModule } from "./sensor/sensor.module";
import { VillageModule } from "./village/village.module";
import { MobileModule } from "./mobile/mobile.module";
import { AppController } from "./app.controller";
import { LocationModule } from "./location/location.module";
import { AdminModule } from "./admin/admin.module";
import { DeviceModule } from "./device/device.module";
import { MqttModule } from "./mqtt/mqtt.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SensorModule,
    VillageModule,
    MobileModule,
    LocationModule,
    AdminModule,
    DeviceModule,
    MqttModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
