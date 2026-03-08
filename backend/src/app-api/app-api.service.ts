import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface InitialDataResponse {
  villageId: number;
  sensors?: Array<{
    id: number;
    name: string;
    type: string;
    unit: string;
    latitude: number | null;
    longitude: number | null;
    lastReading: { value: number; ts: Date; status: string } | null;
  }>;
  messages?: Array<{
    id: number;
    text: string;
    priority: string;
    createdAt: string;
  }>;
  rideshares?: Array<{
    id: number;
    name: string;
    description: string | null;
    personCount: number;
    maxCapacity: number | null;
    latitude: number;
    longitude: number;
  }>;
}

@Injectable()
export class AppApiService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste aller Villages mit Basisinformationen und Feature-Flags fuer die App.
   */
  async getVillages() {
    const villages = await this.prisma.village.findMany({
      include: {
        postalCode: true,
        features: true,
        _count: { select: { sensors: true } },
      },
      orderBy: { name: 'asc' },
    });

    return villages.map((v) => ({
      villageId: v.id,
      name: v.name,
      locationName: v.locationName,
      postalCode: v.postalCode
        ? { zipCode: v.postalCode.zipCode, city: v.postalCode.city }
        : null,
      sensorCount: v._count.sensors,
      features: v.features
        ? {
            sensorData: v.features.enableSensorData,
            weather: v.features.enableWeather,
            messages: v.features.enableMessages,
            events: v.features.enableEvents,
            map: v.features.enableMap,
            rideShare: v.features.enableRideShare,
            textileContainers: v.features.enableTextileContainers,
          }
        : null,
    }));
  }

  /**
   * Konfiguration eines einzelnen Village fuer die App:
   * Feature-Flags + Liste der fuer die App freigegebenen Sensoren.
   */
  async getVillageConfig(villageId: number) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: {
        postalCode: true,
        features: true,
      },
    });

    if (!village) {
      throw new NotFoundException(`Village with id ${villageId} not found`);
    }

    // Nur Sensoren, die aktiv, empfangsbereit und fuer die App freigegeben sind
    const sensors = await this.prisma.sensor.findMany({
      where: {
        villageId,
        isActive: true,
        receiveData: true,
        exposeToApp: true,
      },
      include: { sensorType: true },
      orderBy: { name: 'asc' },
    });

    return {
      villageId: village.id,
      name: village.name,
      locationName: village.locationName,
      postalCode: village.postalCode
        ? { zipCode: village.postalCode.zipCode, city: village.postalCode.city }
        : null,
      features: village.features
        ? {
            sensorData: village.features.enableSensorData,
            weather: village.features.enableWeather,
            messages: village.features.enableMessages,
            events: village.features.enableEvents,
            map: village.features.enableMap,
            rideShare: village.features.enableRideShare,
            textileContainers: village.features.enableTextileContainers,
          }
        : null,
      sensors: sensors.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.sensorType.name,
        unit: s.sensorType.unit,
        latitude: s.latitude,
        longitude: s.longitude,
      })),
    };
  }

  /**
   * Initiale Daten fuer die App: letzte Messwerte, Nachrichten, Mitfahrbaenke.
   * Nur Module liefern, die per Feature-Flag aktiviert sind.
   */
  async getInitialData(villageId: number): Promise<InitialDataResponse> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: { features: true },
    });

    if (!village) {
      throw new NotFoundException(`Village with id ${villageId} not found`);
    }

    const features = village.features;
    const result: InitialDataResponse = { villageId: village.id };

    // Sensordaten: nur wenn enableSensorData aktiv ist
    if (features?.enableSensorData) {
      const sensors = await this.prisma.sensor.findMany({
        where: {
          villageId,
          isActive: true,
          receiveData: true,
          exposeToApp: true,
        },
        include: { sensorType: true },
        orderBy: { name: 'asc' },
      });

      const sensorIds = sensors.map((s) => s.id);

      // Letzte Messwerte pro Sensor laden
      const latestReadings =
        sensorIds.length > 0
          ? await this.prisma.sensorReading.findMany({
              where: { sensorId: { in: sensorIds } },
              orderBy: [{ sensorId: 'asc' }, { ts: 'desc' }],
              distinct: ['sensorId'],
            })
          : [];

      const readingMap = new Map(latestReadings.map((r) => [r.sensorId, r]));

      result.sensors = sensors.map((s) => {
        const reading = readingMap.get(s.id);
        return {
          id: s.id,
          name: s.name,
          type: s.sensorType.name,
          unit: s.sensorType.unit,
          latitude: s.latitude,
          longitude: s.longitude,
          lastReading: reading
            ? { value: reading.value, ts: reading.ts, status: reading.status }
            : null,
        };
      });
    }

    // Nachrichten: nur wenn enableMessages aktiv ist
    if (features?.enableMessages) {
      const messages = await this.prisma.message.findMany({
        where: { villageId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      result.messages = messages.map((m) => ({
        id: m.id,
        text: m.text,
        priority: m.priority,
        createdAt: m.createdAt.toISOString(),
      }));
    }

    // Mitfahrbaenke: nur wenn enableRideShare aktiv ist
    if (features?.enableRideShare) {
      const rideshares = await this.prisma.rideShare.findMany({
        where: { villageId, status: 'active' },
        orderBy: { createdAt: 'desc' },
      });
      result.rideshares = rideshares.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        personCount: r.personCount,
        maxCapacity: r.maxCapacity,
        latitude: r.latitude,
        longitude: r.longitude,
      }));
    }

    return result;
  }
}
