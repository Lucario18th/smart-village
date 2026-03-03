import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { SensorService } from "./sensor.service";

@Controller("sensors")
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  @Get("/village/:villageId")
  listByVillage(@Param("villageId", ParseIntPipe) villageId: number) {
    return this.sensorService.listByVillage(villageId);
  }

  @Post("/village/:villageId")
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
  update(
    @Param("sensorId", ParseIntPipe) sensorId: number,
    @Body() body: { name?: string; infoText?: string; isActive?: boolean },
  ) {
    return this.sensorService.update(sensorId, body);
  }
}
