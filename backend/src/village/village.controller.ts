import {
  Controller,
  Get,
  Put,
  Patch,
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
        features: true,
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

  @Get(':villageId/features')
  @UseGuards(JwtAuthGuard)
  async getVillageFeatures(@Param('villageId', ParseIntPipe) villageId: number) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
    })

    if (!village) {
      throw new BadRequestException('Village not found')
    }

    const features = await this.prisma.villageFeatures.findUnique({
      where: { villageId },
    })

    if (!features) {
      return {
        villageId,
        enableSensorData: true,
        enableWeather: true,
        enableMessages: true,
        enableEvents: false,
        enableMap: true,
        enableRideShare: true,
        enableTextileContainers: false,
        showSensorName: true,
        showSensorType: true,
        showSensorDescription: true,
        showSensorCoordinates: true,
      }
    }

    return {
      villageId: features.villageId,
      enableSensorData: features.enableSensorData,
      enableWeather: features.enableWeather,
      enableMessages: features.enableMessages,
      enableEvents: features.enableEvents,
      enableMap: features.enableMap,
      enableRideShare: features.enableRideShare,
      enableTextileContainers: features.enableTextileContainers,
      showSensorName: features.showSensorName,
      showSensorType: features.showSensorType,
      showSensorDescription: features.showSensorDescription,
      showSensorCoordinates: features.showSensorCoordinates,
    }
  }

  @Patch(':villageId/features')
  @UseGuards(JwtAuthGuard)
  async updateVillageFeatures(
    @Param('villageId', ParseIntPipe) villageId: number,
    @Body()
    body: {
      enableSensorData?: boolean
      enableWeather?: boolean
      enableMessages?: boolean
      enableEvents?: boolean
      enableMap?: boolean
      enableRideShare?: boolean
      enableTextileContainers?: boolean
      showSensorName?: boolean
      showSensorType?: boolean
      showSensorDescription?: boolean
      showSensorCoordinates?: boolean
    },
  ) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
    })

    if (!village) {
      throw new BadRequestException('Village not found')
    }

    const data: Record<string, boolean> = {}
    if (body.enableSensorData !== undefined) data.enableSensorData = body.enableSensorData
    if (body.enableWeather !== undefined) data.enableWeather = body.enableWeather
    if (body.enableMessages !== undefined) data.enableMessages = body.enableMessages
    if (body.enableEvents !== undefined) data.enableEvents = body.enableEvents
    if (body.enableMap !== undefined) data.enableMap = body.enableMap
    if (body.enableRideShare !== undefined) data.enableRideShare = body.enableRideShare
    if (body.enableTextileContainers !== undefined) data.enableTextileContainers = body.enableTextileContainers
    if (body.showSensorName !== undefined) data.showSensorName = body.showSensorName
    if (body.showSensorType !== undefined) data.showSensorType = body.showSensorType
    if (body.showSensorDescription !== undefined) data.showSensorDescription = body.showSensorDescription
    if (body.showSensorCoordinates !== undefined) data.showSensorCoordinates = body.showSensorCoordinates

    const features = await this.prisma.villageFeatures.upsert({
      where: { villageId },
      update: data,
      create: {
        villageId,
        ...data,
      },
    })

    return {
      villageId: features.villageId,
      enableSensorData: features.enableSensorData,
      enableWeather: features.enableWeather,
      enableMessages: features.enableMessages,
      enableEvents: features.enableEvents,
      enableMap: features.enableMap,
      enableRideShare: features.enableRideShare,
      enableTextileContainers: features.enableTextileContainers,
      showSensorName: features.showSensorName,
      showSensorType: features.showSensorType,
      showSensorDescription: features.showSensorDescription,
      showSensorCoordinates: features.showSensorCoordinates,
    }
  }
}
