import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { SensorModule } from "./sensor/sensor.module";
import { AppController } from "./app.controller";

@Module({
  imports: [PrismaModule, AuthModule, SensorModule],
  controllers: [AppController],
})
export class AppModule {}
