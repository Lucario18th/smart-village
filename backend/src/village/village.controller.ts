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

@Controller('villages')
export class VillageController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':villageId')
  @UseGuards(JwtAuthGuard)
  async getVillage(@Param('villageId', ParseIntPipe) villageId: number) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: {
        sensors: {
          include: {
            sensorType: true,
          },
        },
      },
    })

    if (!village) {
      throw new BadRequestException('Village not found')
    }

    return village
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
    },
  ) {
    const updatedVillage = await this.prisma.village.update({
      where: { id: villageId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.locationName !== undefined && {
          locationName: body.locationName,
        }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.infoText !== undefined && { infoText: body.infoText }),
      },
      include: {
        sensors: {
          include: {
            sensorType: true,
          },
        },
      },
    })

    return updatedVillage
  }
}
