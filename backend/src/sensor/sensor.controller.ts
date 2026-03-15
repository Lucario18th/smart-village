import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SensorService } from "./sensor.service";

@Controller("sensors")
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  private parseOptionalNumber(
    value: number | string | null | undefined,
    field: string,
  ): number | null | undefined {
    if (value === null || value === undefined || value === "") {
      return value as null | undefined;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`${field} muss eine Zahl sein`);
    }
    return parsed;
  }

  @Get("/village/:villageId")
  listByVillage(@Param("villageId", ParseIntPipe) villageId: number) {
    return this.sensorService.listByVillage(villageId);
  }

  @Post("/village/:villageId")
  @UseGuards(JwtAuthGuard)
  create(
    @Param("villageId", ParseIntPipe) villageId: number,
    @Body("sensorTypeId", ParseIntPipe) sensorTypeId: number,
    @Body("name") name: string,
    @Body("infoText") infoText?: string,
    @Body("deviceId") deviceId?: number,
    @Body("latitude") latitude?: number,
    @Body("longitude") longitude?: number,
  ) {
    const parsedDeviceId = this.parseOptionalNumber(deviceId, "deviceId");
    const parsedLatitude = this.parseOptionalNumber(latitude, "latitude");
    const parsedLongitude = this.parseOptionalNumber(longitude, "longitude");

    return this.sensorService.create({
      villageId,
      sensorTypeId,
      name,
      infoText,
      deviceId: parsedDeviceId,
      latitude: parsedLatitude ?? undefined,
      longitude: parsedLongitude ?? undefined,
    });
  }

  @Get("/:sensorId")
  getById(@Param("sensorId", ParseIntPipe) sensorId: number) {
    return this.sensorService.getById(sensorId);
  }

  @Patch("/:sensorId")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("sensorId", ParseIntPipe) sensorId: number,
    @Body()
    body: {
      name?: string;
      infoText?: string;
      isActive?: boolean;
      receiveData?: boolean;
      exposeToApp?: boolean;
      deviceId?: number | null;
      latitude?: number | null;
      longitude?: number | null;
    },
  ) {
    const { name, infoText, isActive, receiveData, exposeToApp, deviceId, latitude, longitude } = body;
    const parsedLatitude = this.parseOptionalNumber(latitude, "latitude");
    const parsedLongitude = this.parseOptionalNumber(longitude, "longitude");
    const parsedDeviceId = this.parseOptionalNumber(deviceId, "deviceId");

    return this.sensorService.update(sensorId, {
      name,
      infoText,
      isActive,
      receiveData,
      exposeToApp,
      deviceId: parsedDeviceId,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    });
  }

  @Delete("/:sensorId")
  @UseGuards(JwtAuthGuard)
  delete(@Param("sensorId", ParseIntPipe) sensorId: number) {
    return this.sensorService.delete(sensorId);
  }
}
