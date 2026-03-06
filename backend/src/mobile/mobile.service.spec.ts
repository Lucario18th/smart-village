import { Test, TestingModule } from '@nestjs/testing';
import { MobileService } from './mobile.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MobileService', () => {
  let service: MobileService;
  let prisma: PrismaService;

  const mockPrismaService = {
    village: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    sensor: {
      findMany: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    rideShare: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MobileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MobileService>(MobileService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVillagesSummary', () => {
    it('should return summary of all villages', async () => {
      const mockVillages = [
        {
          id: 1,
          name: 'Village 1',
          locationName: 'Location 1',
          infoText: null,
          _count: { sensors: 5 },
        },
        {
          id: 2,
          name: 'Village 2',
          locationName: 'Location 2',
          infoText: 'Info',
          _count: { sensors: 3 },
        },
      ];
      mockPrismaService.village.findMany.mockResolvedValue(mockVillages);

      const result = await service.getVillagesSummary();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Village 1',
        locationName: 'Location 1',
        infoText: null,
        sensorCount: 5,
      });
      expect(result[1]).toEqual({
        id: 2,
        name: 'Village 2',
        locationName: 'Location 2',
        infoText: 'Info',
        sensorCount: 3,
      });
    });
  });

  describe('getVillageDetail', () => {
    it('should return village details', async () => {
      const mockVillage = {
        id: 1,
        name: 'Village 1',
        locationName: 'Location 1',
        infoText: 'Test info',
        phone: '+49123456789',
        contactEmail: 'contact@village.de',
        contactPhone: '+49987654321',
        _count: { sensors: 5 },
      };
      mockPrismaService.village.findUnique.mockResolvedValue(mockVillage);

      const result = await service.getVillageDetail(1);

      expect(result).toEqual({
        id: 1,
        name: 'Village 1',
        locationName: 'Location 1',
        infoText: 'Test info',
        phone: '+49123456789',
        contactEmail: 'contact@village.de',
        contactPhone: '+49987654321',
        sensorCount: 5,
      });
      expect(prisma.village.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { _count: { select: { sensors: true } } },
      });
    });

    it('should throw error for non-existent village', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue(null);

      await expect(service.getVillageDetail(999)).rejects.toThrow(
        'Village with id 999 not found',
      );
    });
  });

  describe('getSensorsForVillage', () => {
    it('should return sensors with real coordinates', async () => {
      const mockSensors = [
        {
          id: 1,
          name: 'Sensor 1',
          infoText: null,
          latitude: 48.5,
          longitude: 7.3,
          isActive: true,
          sensorType: { id: 1, name: 'Temperature', unit: '°C' },
          status: { status: 'OK', message: null },
        },
      ];
      (mockPrismaService.sensor.findMany as jest.Mock).mockResolvedValue(mockSensors);

      const result = await service.getSensorsForVillage(1);

      expect(result).toHaveLength(1);
      expect(result[0].latitude).toBe(48.5);
      expect(result[0].longitude).toBe(7.3);
      expect(prisma.sensor.findMany).toHaveBeenCalledWith({
        where: { villageId: 1, isActive: true },
        include: { sensorType: true, status: true, device: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should generate mock coordinates when real ones are missing', async () => {
      const mockSensors = [
        {
          id: 1,
          name: 'Sensor 1',
          infoText: null,
          latitude: null,
          longitude: null,
          isActive: true,
          sensorType: { id: 1, name: 'Temperature', unit: '°C' },
          status: null,
        },
      ];
      (mockPrismaService.sensor.findMany as jest.Mock).mockResolvedValue(mockSensors);

      const result = await service.getSensorsForVillage(1);

      expect(result).toHaveLength(1);
      expect(result[0].latitude).toBeDefined();
      expect(result[0].longitude).toBeDefined();
      expect(typeof result[0].latitude).toBe('number');
      expect(typeof result[0].longitude).toBe('number');
    });

    it('should use device coordinates when sensor has none', async () => {
      const mockSensors = [
        {
          id: 1,
          name: 'Sensor 1',
          infoText: null,
          latitude: null,
          longitude: null,
          isActive: true,
          device: { latitude: 50.1, longitude: 8.2 },
          sensorType: { id: 1, name: 'Temperature', unit: '°C' },
          status: null,
        },
      ];
      (mockPrismaService.sensor.findMany as jest.Mock).mockResolvedValue(mockSensors);

      const result = await service.getSensorsForVillage(2);

      expect(result[0].latitude).toBe(50.1);
      expect(result[0].longitude).toBe(8.2);
    });
  });

  describe('getMessagesForVillage', () => {
    it('should return messages for village', async () => {
      const mockMessages = [
        {
          id: 1,
          text: 'Test message 1',
          priority: 'normal',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: 2,
          text: 'Test message 2',
          priority: 'high',
          createdAt: new Date('2024-01-02T00:00:00Z'),
        },
      ];
      (mockPrismaService.message.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await service.getMessagesForVillage(1);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Test message 1');
      expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should return empty array when no messages exist', async () => {
      (mockPrismaService.message.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getMessagesForVillage(1);

      expect(result).toEqual([]);
    });
  });

  describe('getRideSharesForVillage', () => {
    it('should return real rideshares', async () => {
      const mockRideShares = [
        {
          id: 1,
          name: 'Mitfahrbank 1',
          description: 'Test ride share',
          personCount: 2,
          maxCapacity: 5,
          status: 'active',
          latitude: 48.5,
          longitude: 7.3,
        },
      ];
      (mockPrismaService.rideShare.findMany as jest.Mock).mockResolvedValue(mockRideShares);

      const result = await service.getRideSharesForVillage(1);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mitfahrbank 1');
      expect(result[0].id).toBe(1);
    });

    it('should generate mock rideshares when none exist', async () => {
      (mockPrismaService.rideShare.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getRideSharesForVillage(1);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBeLessThan(0); // Mock IDs are negative
      expect(result[0].name).toContain('Mock');
      expect(result[0].latitude).toBeDefined();
      expect(result[0].longitude).toBeDefined();
    });
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      const mockVillage = { id: 1, name: 'Village 1' };
      const mockMessage = {
        id: 1,
        villageId: 1,
        text: 'New message',
        priority: 'high',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      mockPrismaService.village.findUnique.mockResolvedValue(mockVillage);
      (mockPrismaService.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await service.createMessage(1, 'New message', 'high');

      expect(result.id).toBe(1);
      expect(result.text).toBe('New message');
      expect(result.priority).toBe('high');
      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          villageId: 1,
          text: 'New message',
          priority: 'high',
        },
      });
    });

    it('should use default priority when not provided', async () => {
      const mockVillage = { id: 1, name: 'Village 1' };
      const mockMessage = {
        id: 1,
        villageId: 1,
        text: 'New message',
        priority: 'normal',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      mockPrismaService.village.findUnique.mockResolvedValue(mockVillage);
      (mockPrismaService.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await service.createMessage(1, 'New message');

      expect(result.priority).toBe('normal');
    });

    it('should throw error for non-existent village', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue(null);

      await expect(service.createMessage(999, 'Message')).rejects.toThrow(
        'Village with id 999 not found',
      );
    });
  });
});
