import { Test, TestingModule } from '@nestjs/testing';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';
import { BadRequestException } from '@nestjs/common';

describe('MobileController', () => {
  let controller: MobileController;
  let service: MobileService;

  const mockMobileService = {
    getVillagesSummary: jest.fn(),
    getVillageDetail: jest.fn(),
    getSensorsForVillage: jest.fn(),
    getMessagesForVillage: jest.fn(),
    getRideSharesForVillage: jest.fn(),
    createMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MobileController],
      providers: [
        {
          provide: MobileService,
          useValue: mockMobileService,
        },
      ],
    }).compile();

    controller = module.get<MobileController>(MobileController);
    service = module.get<MobileService>(MobileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVillages', () => {
    it('should return list of villages', async () => {
      const mockVillages = [
        { id: 1, name: 'Village 1', locationName: 'Location 1', infoText: null, sensorCount: 5 },
        { id: 2, name: 'Village 2', locationName: 'Location 2', infoText: null, sensorCount: 3 },
      ];
      mockMobileService.getVillagesSummary.mockResolvedValue(mockVillages);

      const result = await controller.getVillages();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVillages);
      expect(result.timestamp).toBeDefined();
      expect(service.getVillagesSummary).toHaveBeenCalled();
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
        sensorCount: 5,
      };
      mockMobileService.getVillageDetail.mockResolvedValue(mockVillage);

      const result = await controller.getVillageDetail(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVillage);
      expect(service.getVillageDetail).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException for non-existent village', async () => {
      mockMobileService.getVillageDetail.mockRejectedValue(new Error('Village not found'));

      await expect(controller.getVillageDetail(999)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSensors', () => {
    it('should return sensors with geo coordinates', async () => {
      const mockSensors = [
        {
          id: 1,
          name: 'Sensor 1',
          infoText: null,
          latitude: 48.5,
          longitude: 7.3,
          sensorType: { id: 1, name: 'Temperature', unit: '°C' },
          status: { status: 'OK', message: null },
        },
      ];
      mockMobileService.getSensorsForVillage.mockResolvedValue(mockSensors);

      const result = await controller.getSensors(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSensors);
      expect(service.getSensorsForVillage).toHaveBeenCalledWith(1);
    });
  });

  describe('getMessages', () => {
    it('should return messages for village', async () => {
      const mockMessages = [
        {
          id: 1,
          text: 'Test message',
          priority: 'normal',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      mockMobileService.getMessagesForVillage.mockResolvedValue(mockMessages);

      const result = await controller.getMessages(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessages);
      expect(service.getMessagesForVillage).toHaveBeenCalledWith(1);
    });

    it('should return empty array if no messages', async () => {
      mockMobileService.getMessagesForVillage.mockResolvedValue([]);

      const result = await controller.getMessages(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getRideShares', () => {
    it('should return rideshares with geo coordinates', async () => {
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
      mockMobileService.getRideSharesForVillage.mockResolvedValue(mockRideShares);

      const result = await controller.getRideShares(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRideShares);
      expect(service.getRideSharesForVillage).toHaveBeenCalledWith(1);
    });

    it('should return mock rideshares if none exist', async () => {
      const mockRideShares = [
        {
          id: -1,
          name: 'Mock Mitfahrbank 1',
          description: 'Kostenlose Mitfahrgelegenheit',
          personCount: 1,
          maxCapacity: 5,
          status: 'active',
          latitude: 48.5,
          longitude: 7.3,
        },
      ];
      mockMobileService.getRideSharesForVillage.mockResolvedValue(mockRideShares);

      const result = await controller.getRideShares(1);

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      const dto = { text: 'New message', priority: 'high' };
      const mockMessage = {
        id: 1,
        text: 'New message',
        priority: 'high',
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      mockMobileService.createMessage.mockResolvedValue(mockMessage);

      const result = await controller.createMessage(1, dto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessage);
      expect(service.createMessage).toHaveBeenCalledWith(1, 'New message', 'high');
    });

    it('should throw BadRequestException for empty text', async () => {
      const dto = { text: '', priority: 'normal' };

      await expect(controller.createMessage(1, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace text', async () => {
      const dto = { text: '   ', priority: 'normal' };

      await expect(controller.createMessage(1, dto)).rejects.toThrow(BadRequestException);
    });

    it('should use default priority if not provided', async () => {
      const dto = { text: 'New message' };
      const mockMessage = {
        id: 1,
        text: 'New message',
        priority: 'normal',
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      mockMobileService.createMessage.mockResolvedValue(mockMessage);

      const result = await controller.createMessage(1, dto);

      expect(result.success).toBe(true);
      expect(service.createMessage).toHaveBeenCalledWith(1, 'New message', undefined);
    });
  });

  describe('Response Format', () => {
    it('should always return success, data, and timestamp', async () => {
      mockMobileService.getVillagesSummary.mockResolvedValue([]);

      const result = await controller.getVillages();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.timestamp).toBe('string');
    });

    it('timestamp should be ISO-8601 format', async () => {
      mockMobileService.getVillagesSummary.mockResolvedValue([]);

      const result = await controller.getVillages();

      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(result.timestamp).toMatch(isoRegex);
    });
  });
});
