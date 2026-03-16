import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  listByVillage(villageId: number) {
    return this.prisma.device.findMany({
      where: { villageId },
      orderBy: { id: "asc" },
      include: { sensors: true },
    });
  }

  async create(params: {
    villageId: number;
    deviceId: string;
    name?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const { villageId, deviceId, name, latitude, longitude } = params;

    const existing = await this.prisma.device.findUnique({
      where: { deviceId },
    });
    if (existing) {
      throw new BadRequestException("Geräte-ID bereits vergeben");
    }

    return this.prisma.device.create({
      data: {
        villageId,
        deviceId,
        name: name ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    });
  }

  update(
    id: number,
    data: { name?: string; latitude?: number | null; longitude?: number | null },
  ) {
    return this.prisma.device.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
      },
      include: { sensors: true },
    });
  }

  findById(id: number) {
    return this.prisma.device.findUnique({
      where: { id },
      include: { sensors: true },
    });
  }
}
