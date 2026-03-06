import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PrismaService } from '../prisma/prisma.service'
import { SensorService } from '../sensor/sensor.service'

@Controller('villages')
export class VillageController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sensorService: SensorService,
  ) {}

  @Get(':villageId')
  @UseGuards(JwtAuthGuard)
  async getVillage(@Param('villageId', ParseIntPipe) villageId: number) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: {
        postalCode: true,
        devices: true,
      },
    })

    if (!village) {
      throw new BadRequestException('Village not found')
    }

    const sensors = await this.sensorService.listByVillage(villageId)

    return {
      ...village,
      sensors,
    }
  }

  @Put(':villageId')
  @UseGuards(JwtAuthGuard)
  async updateVillage(
    @Param('villageId', ParseIntPipe) villageId: number,
    @Body()
    body: {
      name?: string
      locationName?: string
      phone?: string
      infoText?: string
      contactEmail?: string
      contactPhone?: string
      municipalityCode?: string
      postalCodeId?: number
    },
  ) {
    if (body.postalCodeId) {
      const exists = await this.prisma.postalCode.findUnique({
        where: { id: body.postalCodeId },
      })
      if (!exists) {
        throw new BadRequestException('Ungültige Postleitzahl')
      }
    }

    const updatedVillage = await this.prisma.village.update({
      where: { id: villageId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.locationName !== undefined && {
          locationName: body.locationName,
        }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.infoText !== undefined && { infoText: body.infoText }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
        ...(body.municipalityCode !== undefined && { municipalityCode: body.municipalityCode }),
        ...(body.postalCodeId !== undefined && { postalCodeId: body.postalCodeId }),
      },
      include: {
        postalCode: true,
        devices: true,
      },
    })

    const sensors = await this.sensorService.listByVillage(villageId)
    return { ...updatedVillage, sensors }
  }
}
