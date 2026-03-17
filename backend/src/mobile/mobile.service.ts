import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface MockGeoCoordinates {
  latitude: number;
  longitude: number;
}

interface SensorWithGeo {
  id: number;
  name: string;
  infoText: string | null;
  latitude: number;
  longitude: number;
  sensorType: {
    id: number;
    name: string;
    unit: string;
  };
  status: {
    status: string;
    message: string | null;
  } | null;
}

interface RideShareWithGeo {
  id: number;
  name: string;
  description: string | null;
  personCount: number;
  maxCapacity: number | null;
  status: string;
  latitude: number;
  longitude: number;
}

interface MessageResponse {
  id: number;
  text: string;
  priority: string;
  createdAt: string;
}

interface VillageResponse {
  id: number;
  name: string;
  locationName: string;
  infoText: string | null;
  sensorCount: number;
}

interface VillageDetailResponse extends VillageResponse {
  phone: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generiere Mock-Geo-Koordinaten basierend auf Village-ID
   */
  private generateMockCoordinates(villageId: number): MockGeoCoordinates {
    // Konsistente aber unterschiedliche Koordinaten für jedes Village
    const baseLat = 48.0 + (villageId % 10) * 0.5;
    const baseLon = 7.0 + (villageId % 10) * 0.3;
    return {
      latitude: baseLat + Math.random() * 0.1,
      longitude: baseLon + Math.random() * 0.1,
    };
  }

  /**
   * Hole alle Villages mit Sensor-Count
   */
  async getVillagesSummary(): Promise<VillageResponse[]> {
    const villages = await this.prisma.village.findMany({
      include: {
        _count: {
          select: { sensors: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return villages.map((v) => ({
      id: v.id,
      name: v.name,
      locationName: v.locationName,
      infoText: v.infoText,
      sensorCount: v._count.sensors,
    }));
  }

  /**
   * Hole Detail-Informationen für ein Village
   */
  async getVillageDetail(villageId: number): Promise<VillageDetailResponse> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: {
        _count: {
          select: { sensors: true },
        },
      },
    });

    if (!village) {
      throw new Error(`Village with id ${villageId} not found`);
    }

    return {
      id: village.id,
      name: village.name,
      locationName: village.locationName,
      infoText: village.infoText,
      phone: village.phone,
      contactEmail: village.contactEmail,
      contactPhone: village.contactPhone,
      sensorCount: village._count.sensors,
    };
  }

  /**
   * Hole Sensoren für ein Village mit Geo-Koordinaten
   * Generiert Mock-Daten wenn keine echten Koordinaten vorhanden
   */
  async getSensorsForVillage(villageId: number): Promise<SensorWithGeo[]> {
    const sensors = await this.prisma.sensor.findMany({
      where: { villageId, isActive: true },
      include: {
        sensorType: true,
        status: true,
        device: true,
      },
      orderBy: { name: 'asc' },
    } as any);

    return sensors.map((sensor: any) => {
      // Verwende Sensor-Koordinaten, ansonsten Device-Koordinaten oder Mock-Daten
      const hasSensorCoords =
        typeof sensor.latitude === 'number' && typeof sensor.longitude === 'number';
      const hasDeviceCoords =
        sensor.device &&
        typeof sensor.device.latitude === 'number' &&
        typeof sensor.device.longitude === 'number';

      const coordinates = hasSensorCoords
        ? { latitude: sensor.latitude, longitude: sensor.longitude }
        : hasDeviceCoords
        ? { latitude: sensor.device.latitude, longitude: sensor.device.longitude }
        : this.generateMockCoordinates(villageId);

      return {
        id: sensor.id,
        name: sensor.name,
        infoText: sensor.infoText,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        sensorType: {
          id: sensor.sensorType.id,
          name: sensor.sensorType.name,
          unit: sensor.sensorType.unit,
        },
        status: sensor.status
          ? {
              status: sensor.status.status,
              message: sensor.status.message,
            }
          : null,
      };
    });
  }

  /**
   * Hole Nachrichten für ein Village
   */
  async getMessagesForVillage(villageId: number): Promise<MessageResponse[]> {
    const messages = await (this.prisma as any).message.findMany({
      where: { villageId },
      orderBy: { createdAt: 'desc' },
    });

    return messages.map((msg: any) => ({
      id: msg.id,
      text: msg.text,
      priority: msg.priority,
      createdAt: msg.createdAt.toISOString(),
    }));
  }

  /**
   * Hole aktivierte Custom-Module fuer ein Village
   */
  async getModulesForVillage(villageId: number) {
    const modules = await this.prisma.villageModule.findMany({
      where: { villageId, isEnabled: true },
      include: { sensors: { select: { id: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return modules.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? '',
      iconKey: m.iconKey,
      sensorIds: m.sensors.map((s) => s.id),
    }));
  }

  /**
   * Hole RideShares für ein Village mit Mock-Daten
   * Generiert 1-2 Mock-Einträge wenn keine echten vorhanden
   */
  async getRideSharesForVillage(villageId: number): Promise<RideShareWithGeo[]> {
    const rideshares = await (this.prisma as any).rideShare.findMany({
      where: { villageId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    // Wenn keine RideShares vorhanden, generiere Mock-Daten
    if (rideshares.length === 0) {
      const mockCount = (villageId % 3) + 1; // 1-2 Mock-Einträge
      const mockRideShares: RideShareWithGeo[] = [];

      for (let i = 0; i < mockCount; i++) {
        const coords = this.generateMockCoordinates(villageId + i);
        mockRideShares.push({
          id: -(i + 1), // Negative IDs für Mock-Daten
          name: `Mock Mitfahrbank ${i + 1}`,
          description: `Kostenlose Mitfahrgelegenheit im ${villageId === 1 ? 'Zentrum' : 'Dorf'}`,
          personCount: Math.floor(Math.random() * 3),
          maxCapacity: 5,
          status: 'active',
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      }

      return mockRideShares;
    }

    return rideshares.map((rs: any) => ({
      id: rs.id,
      name: rs.name,
      description: rs.description,
      personCount: rs.personCount,
      maxCapacity: rs.maxCapacity,
      status: rs.status,
      latitude: rs.latitude,
      longitude: rs.longitude,
    }));
  }

  /**
   * Erstelle eine neue Nachricht in einem Village
   */
  async createMessage(
    villageId: number,
    text: string,
    priority: string = 'normal',
  ): Promise<MessageResponse> {
    // Validiere dass das Village existiert
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village) {
      throw new Error(`Village with id ${villageId} not found`);
    }

    const message = await (this.prisma as any).message.create({
      data: {
        villageId,
        text,
        priority,
      },
    });

    return {
      id: message.id,
      text: message.text,
      priority: message.priority,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
