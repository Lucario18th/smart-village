import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
  HttpCode,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PrismaService } from '../prisma/prisma.service'
import { SensorService } from '../sensor/sensor.service'

const MODULE_ICON_KEYS = new Set([
  'sensors',
  'weather',
  'messages',
  'map',
  'rideshare',
  'events',
  'textile',
  'tree',
  'water',
  'camera',
  'energy',
])

const MODULE_TYPES = new Set(['Mobilitaet', 'Info', 'Service', 'Umwelt', 'Sicherheit', 'Energie', 'Community'])

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
      statusText?: string
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
        ...(body.statusText !== undefined && { statusText: body.statusText }),
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

  // ── Custom Modules ────────────────────────────────────────────────────────

  @Get(':villageId/modules')
  @UseGuards(JwtAuthGuard)
  async getModules(@Param('villageId', ParseIntPipe) villageId: number) {
    const village = await this.prisma.village.findUnique({ where: { id: villageId } })
    if (!village) throw new NotFoundException('Village not found')

    const modules = await this.prisma.villageModule.findMany({
      where: { villageId },
      include: { sensors: { select: { id: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return modules.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? '',
      iconKey: m.iconKey,
      moduleType: m.moduleType,
      isEnabled: m.isEnabled,
      sensorIds: m.sensors.map((s) => s.id),
    }))
  }

  @Post(':villageId/modules')
  @UseGuards(JwtAuthGuard)
  async createModule(
    @Param('villageId', ParseIntPipe) villageId: number,
    @Body() body: { name: string; description?: string; iconKey?: string; moduleType?: string; sensorIds?: number[] },
  ) {
    if (!body.name?.trim()) throw new BadRequestException('Name ist erforderlich')
    if (body.iconKey !== undefined && !MODULE_ICON_KEYS.has(body.iconKey)) {
      throw new BadRequestException('Ungültiges Modul-Icon')
    }
    if (body.moduleType !== undefined && !MODULE_TYPES.has(body.moduleType)) {
      throw new BadRequestException('Ungültiger Modultyp')
    }

    const village = await this.prisma.village.findUnique({ where: { id: villageId } })
    if (!village) throw new NotFoundException('Village not found')

    // Nur gültige, in dieser Village vorhandene Sensoren connecten
    const rawIds = (body.sensorIds ?? []).map(Number).filter((id) => Number.isFinite(id) && id > 0)
    const validSensors = rawIds.length > 0
      ? await this.prisma.sensor.findMany({ where: { id: { in: rawIds }, villageId }, select: { id: true } })
      : []
    const sensorIds = validSensors.map((s) => s.id)

    const created = await this.prisma.villageModule.create({
      data: {
        villageId,
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        iconKey: body.iconKey ?? 'sensors',
        moduleType: body.moduleType ?? 'Service',
        sensors: sensorIds.length > 0 ? { connect: sensorIds.map((id) => ({ id })) } : undefined,
      },
      include: { sensors: { select: { id: true } } },
    })

    return {
      id: created.id,
      name: created.name,
      description: created.description ?? '',
      iconKey: created.iconKey,
      moduleType: created.moduleType,
      isEnabled: created.isEnabled,
      sensorIds: created.sensors.map((s) => s.id),
    }
  }

  @Patch(':villageId/modules/:moduleId')
  @UseGuards(JwtAuthGuard)
  async updateModule(
    @Param('villageId', ParseIntPipe) villageId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: { name?: string; description?: string; iconKey?: string; moduleType?: string; isEnabled?: boolean; sensorIds?: number[] },
  ) {
    const existing = await this.prisma.villageModule.findFirst({
      where: { id: moduleId, villageId },
    })
    if (!existing) throw new NotFoundException('Modul nicht gefunden')
    if (body.iconKey !== undefined && !MODULE_ICON_KEYS.has(body.iconKey)) {
      throw new BadRequestException('Ungültiges Modul-Icon')
    }
    if (body.moduleType !== undefined && !MODULE_TYPES.has(body.moduleType)) {
      throw new BadRequestException('Ungültiger Modultyp')
    }

    // Nur gültige, in dieser Village vorhandene Sensoren setzen
    let validatedSensorIds: number[] | undefined
    if (body.sensorIds !== undefined) {
      const rawIds = body.sensorIds.map(Number).filter((id) => Number.isFinite(id) && id > 0)
      const validSensors = rawIds.length > 0
        ? await this.prisma.sensor.findMany({ where: { id: { in: rawIds }, villageId }, select: { id: true } })
        : []
      validatedSensorIds = validSensors.map((s) => s.id)
    }

    const updated = await this.prisma.villageModule.update({
      where: { id: moduleId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() || null }),
        ...(body.iconKey !== undefined && { iconKey: body.iconKey }),
        ...(body.moduleType !== undefined && { moduleType: body.moduleType }),
        ...(body.isEnabled !== undefined && { isEnabled: body.isEnabled }),
        ...(validatedSensorIds !== undefined && {
          sensors: { set: validatedSensorIds.map((id) => ({ id })) },
        }),
      },
      include: { sensors: { select: { id: true } } },
    })

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? '',
      iconKey: updated.iconKey,
      moduleType: updated.moduleType,
      isEnabled: updated.isEnabled,
      sensorIds: updated.sensors.map((s) => s.id),
    }
  }

  @Delete(':villageId/modules/:moduleId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteModule(
    @Param('villageId', ParseIntPipe) villageId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) {
    const existing = await this.prisma.villageModule.findFirst({
      where: { id: moduleId, villageId },
    })
    if (!existing) throw new NotFoundException('Modul nicht gefunden')

    await this.prisma.villageModule.delete({ where: { id: moduleId } })
  }
}
