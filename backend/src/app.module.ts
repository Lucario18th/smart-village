import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { SensorModule } from "./sensor/sensor.module";

@Module({
  imports: [PrismaModule, AuthModule, SensorModule],
})
export class AppModule {}
