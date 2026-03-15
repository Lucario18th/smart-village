import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("locations")
export class LocationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("search")
  async search(@Query("query") query: string) {
    const normalized = (query || "").trim();
    if (!normalized) {
      throw new BadRequestException("query is required");
    }

    const take = 15;

    const results = await this.prisma.postalCode.findMany({
      where: {
        OR: [
          { zipCode: { contains: normalized, mode: "insensitive" } },
          { city: { contains: normalized, mode: "insensitive" } },
        ],
      },
      orderBy: [{ zipCode: "asc" }, { city: "asc" }],
      take,
    });

    return results.map((entry) => ({
      id: entry.id,
      zipCode: entry.zipCode,
      city: entry.city,
      state: entry.state,
    }));
  }
}
