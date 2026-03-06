import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { LocationController } from "./location.controller";

@Module({
  imports: [PrismaModule],
  controllers: [LocationController],
})
export class LocationModule {}
