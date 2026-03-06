import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SensorService {
  constructor(private readonly prisma: PrismaService) {}

  listByVillage(villageId: number) {
    return this.prisma.sensor.findMany({
      where: { villageId },
      include: { sensorType: true, status: true, device: true },
      orderBy: { id: "asc" },
    });
  }

  async create(params: {
    villageId: number;
    sensorTypeId: number;
    name: string;
    infoText?: string;
    deviceId?: number | null;
    latitude?: number;
    longitude?: number;
  }) {
    const {
      villageId,
      sensorTypeId,
      name,
      infoText,
      deviceId,
      latitude,
      longitude,
    } = params;

    if (deviceId) {
      const device = await this.prisma.device.findUnique({
        where: { id: deviceId },
      });
      if (!device) {
        throw new BadRequestException("Gerät wurde nicht gefunden");
      }
      if (device.villageId !== villageId) {
        throw new BadRequestException("Gerät gehört zu einem anderen Dorf");
      }
    }

    return this.prisma.sensor.create({
      data: {
        villageId,
        sensorTypeId,
        name,
        infoText: infoText ?? null,
        deviceId: deviceId ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
      include: { device: true, sensorType: true, status: true },
    });
  }

  getById(sensorId: number) {
    return this.prisma.sensor.findUnique({
      where: { id: sensorId },
      include: { sensorType: true, village: true, status: true, device: true },
    });
  }

  async update(
    sensorId: number,
    data: {
      name?: string;
      infoText?: string;
      isActive?: boolean;
      deviceId?: number | null;
      latitude?: number | null;
      longitude?: number | null;
    },
  ) {
    if (data.deviceId !== undefined) {
      if (data.deviceId === null) {
        // allow unlinking from device
      } else {
        const device = await this.prisma.device.findUnique({
          where: { id: data.deviceId },
        });
        if (!device) {
          throw new BadRequestException("Gerät wurde nicht gefunden");
        }
        const sensor = await this.prisma.sensor.findUnique({
          where: { id: sensorId },
          select: { villageId: true },
        });
        if (sensor && sensor.villageId !== device.villageId) {
          throw new BadRequestException("Gerät gehört zu einem anderen Dorf");
        }
      }
    }

    return this.prisma.sensor.update({
      where: { id: sensorId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.infoText !== undefined && { infoText: data.infoText }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.deviceId !== undefined && { deviceId: data.deviceId }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
      },
      include: { device: true, sensorType: true, status: true },
    });
  }

  delete(sensorId: number) {
    // First delete all sensor readings to avoid foreign key constraint error
    return this.prisma.$transaction([
      this.prisma.sensorReading.deleteMany({
        where: { sensorId },
      }),
      this.prisma.sensor.delete({
        where: { id: sensorId },
      }),
    ]);
  }
}
