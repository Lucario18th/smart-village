import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AppApiService } from './app-api.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Controller('app')
export class AppApiController {
  constructor(private readonly appApiService: AppApiService) {}

  /**
   * GET /app/villages
   * Liste aller verfuegbaren Gemeinden mit Basisinfos und Feature-Flags.
   */
  @Get('villages')
  async getVillages(): Promise<ApiResponse<any>> {
    const villages = await this.appApiService.getVillages();
    return {
      success: true,
      data: villages,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /app/villages/:villageId/config
   * Konfiguration einer Gemeinde: Feature-Flags und freigegebene Sensoren.
   */
  @Get('villages/:villageId/config')
  async getVillageConfig(
    @Param('villageId', ParseIntPipe) villageId: number,
  ): Promise<ApiResponse<any>> {
    const config = await this.appApiService.getVillageConfig(villageId);
    return {
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /app/villages/:villageId/initial-data
   * Initiale Daten fuer die App (letzte Messwerte, Nachrichten, Mitfahrbaenke).
   * Optimierung fuer den ersten Ladevorgang; Live-Updates kommen ueber MQTT.
   */
  @Get('villages/:villageId/initial-data')
  async getInitialData(
    @Param('villageId', ParseIntPipe) villageId: number,
  ): Promise<ApiResponse<any>> {
    const data = await this.appApiService.getInitialData(villageId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
