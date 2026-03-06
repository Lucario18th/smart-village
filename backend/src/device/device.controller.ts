import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DeviceService } from "./device.service";

@Controller("devices")
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  private parseOptionalNumber(
    value: number | string | null | undefined,
    field: string,
  ): number | null | undefined {
    if (value === null || value === undefined || value === "") {
      return value as null | undefined;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`${field} muss numerisch sein`);
    }
    return parsed;
  }

  @Get("/village/:villageId")
  listByVillage(@Param("villageId", ParseIntPipe) villageId: number) {
    return this.deviceService.listByVillage(villageId);
  }

  @Post("/village/:villageId")
  @UseGuards(JwtAuthGuard)
  create(
    @Param("villageId", ParseIntPipe) villageId: number,
    @Body("deviceId") deviceId: string,
    @Body("name") name?: string,
    @Body("latitude") latitude?: number,
    @Body("longitude") longitude?: number,
  ) {
    const parsedLatitude = this.parseOptionalNumber(latitude, "latitude");
    const parsedLongitude = this.parseOptionalNumber(longitude, "longitude");

    return this.deviceService.create({
      villageId,
      deviceId,
      name,
      latitude: parsedLatitude ?? undefined,
      longitude: parsedLongitude ?? undefined,
    });
  }

  @Patch("/:id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body("name") name?: string,
    @Body("latitude") latitude?: number | null,
    @Body("longitude") longitude?: number | null,
  ) {
    const parsedLatitude = this.parseOptionalNumber(latitude, "latitude");
    const parsedLongitude = this.parseOptionalNumber(longitude, "longitude");

    return this.deviceService.update(id, {
      name,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    });
  }
}
