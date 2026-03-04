import {
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
  ) {
    return this.sensorService.create(villageId, sensorTypeId, name, infoText);
  }

  @Get("/:sensorId")
  getById(@Param("sensorId", ParseIntPipe) sensorId: number) {
    return this.sensorService.getById(sensorId);
  }

  @Patch("/:sensorId")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("sensorId", ParseIntPipe) sensorId: number,
    @Body() body: { name?: string; infoText?: string; isActive?: boolean },
  ) {
    return this.sensorService.update(sensorId, body);
  }

  @Delete("/:sensorId")
  @UseGuards(JwtAuthGuard)
  delete(@Param("sensorId", ParseIntPipe) sensorId: number) {
    return this.sensorService.delete(sensorId);
  }
}
