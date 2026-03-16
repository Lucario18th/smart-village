import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { DeviceController } from "./device.controller";
import { DeviceService } from "./device.service";

@Module({
  imports: [PrismaModule],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}
