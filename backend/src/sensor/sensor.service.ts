import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SensorService {
  constructor(private readonly prisma: PrismaService) {}

  listByVillage(villageId: number) {
    return this.prisma.sensor.findMany({
      where: { villageId },
      include: { sensorType: true, status: true },
      orderBy: { id: "asc" },
    });
  }

  create(
    villageId: number,
    sensorTypeId: number,
    name: string,
    infoText?: string,
  ) {
    return this.prisma.sensor.create({
      data: {
        villageId,
        sensorTypeId,
        name,
        infoText: infoText ?? null,
      },
    });
  }

  getById(sensorId: number) {
    return this.prisma.sensor.findUnique({
      where: { id: sensorId },
      include: { sensorType: true, village: true, status: true },
    });
  }

  update(
    sensorId: number,
    data: { name?: string; infoText?: string; isActive?: boolean },
  ) {
    return this.prisma.sensor.update({
      where: { id: sensorId },
      data,
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
