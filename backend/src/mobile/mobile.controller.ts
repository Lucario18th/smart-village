import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { MobileService } from './mobile.service';

interface CreateMessageDto {
  text: string;
  priority?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Controller('mobile-api')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  /**
   * GET /mobile-api/villages
   * Hole Liste aller Dörfer mit Sensor-Count
   */
  @Get('villages')
  async getVillages(): Promise<ApiResponse<any>> {
    const villages = await this.mobileService.getVillagesSummary();
    return {
      success: true,
      data: villages,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /mobile-api/villages/:id
   * Hole Detail-Informationen für ein Dorf
   */
  @Get('villages/:id')
  async getVillageDetail(
    @Param('id', ParseIntPipe) villageId: number,
  ): Promise<ApiResponse<any>> {
    try {
      const village = await this.mobileService.getVillageDetail(villageId);
      return {
        success: true,
        data: village,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Village not found');
    }
  }

  /**
   * GET /mobile-api/villages/:id/sensors
   * Hole Sensordaten für ein Dorf mit Geo-Koordinaten
   */
  @Get('villages/:id/sensors')
  async getSensors(
    @Param('id', ParseIntPipe) villageId: number,
  ): Promise<ApiResponse<any>> {
    const sensors = await this.mobileService.getSensorsForVillage(villageId);
    return {
      success: true,
      data: sensors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /mobile-api/villages/:id/messages
   * Hole Nachrichten für ein Dorf
   */
  @Get('villages/:id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) villageId: number,
  ): Promise<ApiResponse<any>> {
    const messages = await this.mobileService.getMessagesForVillage(villageId);
    return {
      success: true,
      data: messages,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /mobile-api/villages/:id/rideshares
   * Hole Mitfahrbänke für ein Dorf mit Geo-Koordinaten
   */
  @Get('villages/:id/rideshares')
  async getRideShares(
    @Param('id', ParseIntPipe) villageId: number,
  ): Promise<ApiResponse<any>> {
    const rideshares = await this.mobileService.getRideSharesForVillage(
      villageId,
    );
    return {
      success: true,
      data: rideshares,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /mobile-api/villages/:id/messages
   * Erstelle eine neue Nachricht für ein Dorf
   */
  @Post('villages/:id/messages')
  async createMessage(
    @Param('id', ParseIntPipe) villageId: number,
    @Body() dto: CreateMessageDto,
  ): Promise<ApiResponse<any>> {
    if (!dto.text || dto.text.trim().length === 0) {
      throw new BadRequestException('Message text is required');
    }

    try {
      const message = await this.mobileService.createMessage(
        villageId,
        dto.text,
        dto.priority,
      );
      return {
        success: true,
        data: message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to create message');
    }
  }

  /**
   * GET /mobile-api/villages/:id/modules
   * Aktivierte Custom-Module einer Gemeinde (fuer mobile App)
   */
  @Get('villages/:id/modules')
  async getModules(
    @Param('id', ParseIntPipe) villageId: number,
  ): Promise<ApiResponse<any>> {
    const modules = await this.mobileService.getModulesForVillage(villageId);
    return {
      success: true,
      data: modules,
      timestamp: new Date().toISOString(),
    };
  }
}
