import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteAccount(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    const villages = await this.prisma.village.findMany({
      where: { accountId },
      select: { id: true },
    });
    const villageIds = villages.map((v) => v.id);

    await this.prisma.$transaction(async (tx) => {
      if (villageIds.length > 0) {
        await tx.sensorReading.deleteMany({
          where: { sensor: { villageId: { in: villageIds } } },
        });
        await tx.sensorStatus.deleteMany({
          where: { sensor: { villageId: { in: villageIds } } },
        });
        await tx.sensor.deleteMany({ where: { villageId: { in: villageIds } } });
        await tx.message.deleteMany({ where: { villageId: { in: villageIds } } });
        await tx.rideShare.deleteMany({ where: { villageId: { in: villageIds } } });
        await tx.user.deleteMany({ where: { villageId: { in: villageIds } } });
        await tx.village.deleteMany({ where: { id: { in: villageIds } } });
      }

      await tx.account.delete({ where: { id: accountId } });
    });

    return { success: true };
  }
}
