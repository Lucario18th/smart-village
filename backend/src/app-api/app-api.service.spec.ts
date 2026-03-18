import { Test, TestingModule } from '@nestjs/testing';
import { AppApiService } from './app-api.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AppApiService', () => {
  let service: AppApiService;

  const mockPrismaService = {
    village: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    sensor: {
      findMany: jest.fn(),
    },
    sensorReading: {
      findMany: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
    },
    rideShare: {
      findMany: jest.fn(),
    },
    villageModule: {
      findMany: jest.fn(),
    },
    villageFeatures: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppApiService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AppApiService>(AppApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    mockPrismaService.villageModule.findMany.mockResolvedValue([]);
  });

  describe('getVillages', () => {
    it('should return all villages with features and postal code', async () => {
      const mockVillages = [
        {
          id: 1,
          name: 'Freiburg',
          locationName: '79098 Freiburg',
          postalCode: { zipCode: '79098', city: 'Freiburg im Breisgau' },
          features: {
            enableSensorData: true,
            enableWeather: true,
            enableMessages: true,
            enableEvents: false,
            enableMap: true,
            enableRideShare: true,
            enableTextileContainers: false,
          },
          _count: { sensors: 5 },
        },
      ];
      mockPrismaService.village.findMany.mockResolvedValue(mockVillages);

      const result = await service.getVillages();

      expect(result).toHaveLength(1);
      expect(result[0].villageId).toBe(1);
      expect(result[0].name).toBe('Freiburg');
      expect(result[0].postalCode).toEqual({ zipCode: '79098', city: 'Freiburg im Breisgau' });
      expect(result[0].features).toEqual({
        sensorData: true,
        weather: true,
        messages: true,
        events: false,
        map: true,
        rideShare: true,
        textileContainers: false,
      });
    });

    it('should return null features when VillageFeatures not set', async () => {
      const mockVillages = [
        {
          id: 2,
          name: 'Test Village',
          locationName: 'Test',
          postalCode: null,
          features: null,
          _count: { sensors: 0 },
        },
      ];
      mockPrismaService.village.findMany.mockResolvedValue(mockVillages);

      const result = await service.getVillages();

      expect(result[0].features).toBeNull();
      expect(result[0].postalCode).toBeNull();
    });
  });

  describe('getVillageConfig', () => {
    it('should return config with exposed sensors only', async () => {
      const mockVillage = {
        id: 1,
        name: 'Freiburg',
        locationName: '79098 Freiburg',
        postalCode: { zipCode: '79098', city: 'Freiburg im Breisgau' },
        account: { isPublicAppApiEnabled: true },
        features: {
          enableSensorData: true,
          enableWeather: false,
          enableMessages: true,
          enableEvents: false,
          enableMap: true,
          enableRideShare: true,
          enableTextileContainers: false,
          showSensorName: true,
          showSensorType: true,
          showSensorDescription: false,
          showSensorCoordinates: true,
        },
      };
      const mockSensors = [
        {
          id: 1,
          name: 'Temperatur Rathaus',
          latitude: 47.99,
          longitude: 7.85,
          sensorType: { name: 'Temperature', unit: '°C' },
        },
      ];
      mockPrismaService.village.findUnique.mockResolvedValue(mockVillage);
      mockPrismaService.sensor.findMany.mockResolvedValue(mockSensors);

      const result = await service.getVillageConfig(1);

      expect(result.villageId).toBe(1);
      expect(result.features?.weather).toBe(false);
      expect(result.sensors).toHaveLength(1);
      expect(result.sensors[0].type).toBe('Temperature');
      expect(result.sensorDetailVisibility).toEqual({
        name: true,
        type: true,
        description: false,
        coordinates: true,
      });
      expect(mockPrismaService.sensor.findMany).toHaveBeenCalledWith({
        where: {
          villageId: 1,
          isActive: true,
          receiveData: true,
          exposeToApp: true,
        },
        include: { sensorType: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should throw NotFoundException for non-existent village', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue(null);

      await expect(service.getVillageConfig(999)).rejects.toThrow(NotFoundException);
    });

    it('should return null sensorDetailVisibility when features not set', async () => {
      const mockVillage = {
        id: 2,
        name: 'Test Village',
        locationName: 'Test',
        postalCode: null,
        account: { isPublicAppApiEnabled: true },
        features: null,
      };
      mockPrismaService.village.findUnique.mockResolvedValue(mockVillage);
      mockPrismaService.sensor.findMany.mockResolvedValue([]);

      const result = await service.getVillageConfig(2);

      expect(result.features).toBeNull();
      expect(result.sensorDetailVisibility).toBeNull();
    });
  });

  describe('getInitialData', () => {
    it('should return sensor data when enableSensorData is true', async () => {
      const mockVillage = {
        id: 1,
        account: { isPublicAppApiEnabled: true },
        features: {
          enableSensorData: true,
          enableMessages: false,
          enableRideShare: false,
        },
      };
      const mockSensors = [
        {
          id: 1,
          name: 'Temp',
          sensorType: { name: 'Temperature', unit: '°C' },
          latitude: 47.99,
          longitude: 7.85,
        },
      ];
      const mockReadings = [
        { sensorId: 1, value: 23.5, ts: new Date('2025-01-15T10:30:00Z'), status: 'OK' },
      ];
      mockPrismaService.village.findUnique.mockResolvedValue(mockVillage);
      mockPrismaService.sensor.findMany.mockResolvedValue(mockSensors);
      mockPrismaService.sensorReading.findMany.mockResolvedValue(mockReadings);

      const result = await service.getInitialData(1);

      expect(result.villageId).toBe(1);
      expect(result.sensors).toBeDefined();
      expect((result.sensors as any[])[0].lastReading.value).toBe(23.5);
      // Messages and rideshares should not be included
      expect(result.messages).toBeUndefined();
      expect(result.rideshares).toBeUndefined();
    });

    it('should return messages when enableMessages is true', async () => {
      const mockVillage = {
        id: 1,
        account: { isPublicAppApiEnabled: true },
        features: {
          enableSensorData: false,
          enableMessages: true,
          enableRideShare: false,
        },
      };
      const mockMessages = [
        { id: 1, text: 'Hello', priority: 'normal', createdAt: new Date('2025-01-15T10:00:00Z') },
      ];
      mockPrismaService.village.findUnique.mockResolvedValue(mockVillage);
      mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.getInitialData(1);

      expect(result.messages).toBeDefined();
      expect((result.messages as any[])[0].text).toBe('Hello');
      expect(result.sensors).toBeUndefined();
    });

    it('should return rideshares when enableRideShare is true', async () => {
      const mockVillage = {
        id: 1,
        account: { isPublicAppApiEnabled: true },
        features: {
          enableSensorData: false,
          enableMessages: false,
          enableRideShare: true,
        },
      };
      const mockRideshares = [
        {
          id: 1,
          name: 'Mitfahrbank 1',
          description: 'Test',
          personCount: 2,
          maxCapacity: 5,
          latitude: 47.99,
          longitude: 7.85,
        },
      ];
      mockPrismaService.village.findUnique.mockResolvedValue(mockVillage);
      mockPrismaService.rideShare.findMany.mockResolvedValue(mockRideshares);

      const result = await service.getInitialData(1);

      expect(result.rideshares).toBeDefined();
      expect((result.rideshares as any[])[0].name).toBe('Mitfahrbank 1');
    });

    it('should throw NotFoundException for non-existent village', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue(null);

      await expect(service.getInitialData(999)).rejects.toThrow(NotFoundException);
    });

    it('should return only villageId when no features are configured', async () => {
      const mockVillage = {
        id: 1,
        account: { isPublicAppApiEnabled: true },
        features: null,
      };
      mockPrismaService.village.findUnique.mockResolvedValue(mockVillage);

      const result = await service.getInitialData(1);

      expect(result.villageId).toBe(1);
      expect(result.sensors).toBeUndefined();
      expect(result.messages).toBeUndefined();
      expect(result.rideshares).toBeUndefined();
    });
  });
});
