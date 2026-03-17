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
   * Initiale Daten fuer die App (letzte Messwerte, Nachrichten, Mitfahrbaenke, Module).
    * Optimierung fuer den ersten Ladevorgang; Clients aktualisieren diese Daten per Polling.
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

  /**
   * GET /app/villages/:villageId/modules
   * Aktivierte benutzerdefinierte Module einer Gemeinde (ohne Auth).
   * Gibt Module mit den zugeordneten Sensor-IDs zurueck.
   */
  @Get('villages/:villageId/modules')
  async getVillageModules(
    @Param('villageId', ParseIntPipe) villageId: number,
  ): Promise<ApiResponse<any>> {
    const modules = await this.appApiService.getVillageModules(villageId);
    return {
      success: true,
      data: modules,
      timestamp: new Date().toISOString(),
    };
  }
}
