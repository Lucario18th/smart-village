import { Test, TestingModule } from '@nestjs/testing';
import { AppApiController } from './app-api.controller';
import { AppApiService } from './app-api.service';
import { NotFoundException } from '@nestjs/common';

describe('AppApiController', () => {
  let controller: AppApiController;
  let service: AppApiService;

  const mockAppApiService = {
    getVillages: jest.fn(),
    getVillageConfig: jest.fn(),
    getInitialData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppApiController],
      providers: [
        {
          provide: AppApiService,
          useValue: mockAppApiService,
        },
      ],
    }).compile();

    controller = module.get<AppApiController>(AppApiController);
    service = module.get<AppApiService>(AppApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVillages', () => {
    it('should return list of villages with features', async () => {
      const mockVillages = [
        {
          villageId: 1,
          name: 'Freiburg',
          locationName: '79098 Freiburg',
          postalCode: { zipCode: '79098', city: 'Freiburg im Breisgau' },
          sensorCount: 5,
          features: {
            sensorData: true,
            weather: true,
            messages: true,
            events: false,
            map: true,
            rideShare: true,
            textileContainers: false,
          },
        },
      ];
      mockAppApiService.getVillages.mockResolvedValue(mockVillages);

      const result = await controller.getVillages();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVillages);
      expect(result.timestamp).toBeDefined();
      expect(service.getVillages).toHaveBeenCalled();
    });

    it('should return empty array when no villages exist', async () => {
      mockAppApiService.getVillages.mockResolvedValue([]);

      const result = await controller.getVillages();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getVillageConfig', () => {
    it('should return village configuration with sensors', async () => {
      const mockConfig = {
        villageId: 1,
        name: 'Freiburg',
        locationName: '79098 Freiburg',
        postalCode: { zipCode: '79098', city: 'Freiburg im Breisgau' },
        features: {
          sensorData: true,
          weather: true,
          messages: true,
          events: false,
          map: true,
          rideShare: true,
          textileContainers: false,
        },
        sensors: [
          {
            id: 1,
            name: 'Temperatur Rathaus',
            type: 'Temperature',
            unit: '°C',
            latitude: 47.99,
            longitude: 7.85,
          },
        ],
      };
      mockAppApiService.getVillageConfig.mockResolvedValue(mockConfig);

      const result = await controller.getVillageConfig(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConfig);
      expect(result.data.sensors).toHaveLength(1);
      expect(service.getVillageConfig).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException for non-existent village', async () => {
      mockAppApiService.getVillageConfig.mockRejectedValue(
        new NotFoundException('Village with id 999 not found'),
      );

      await expect(controller.getVillageConfig(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInitialData', () => {
    it('should return initial data for a village', async () => {
      const mockData = {
        villageId: 1,
        sensors: [
          {
            id: 1,
            name: 'Temperatur Rathaus',
            type: 'Temperature',
            unit: '°C',
            latitude: 47.99,
            longitude: 7.85,
            lastReading: { value: 23.5, ts: '2025-01-15T10:30:00Z', status: 'OK' },
          },
        ],
        messages: [
          { id: 1, text: 'Willkommen', priority: 'normal', createdAt: '2025-01-15T10:00:00.000Z' },
        ],
        rideshares: [],
      };
      mockAppApiService.getInitialData.mockResolvedValue(mockData);

      const result = await controller.getInitialData(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(service.getInitialData).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException for non-existent village', async () => {
      mockAppApiService.getInitialData.mockRejectedValue(
        new NotFoundException('Village with id 999 not found'),
      );

      await expect(controller.getInitialData(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Response Format', () => {
    it('should always return success, data, and timestamp', async () => {
      mockAppApiService.getVillages.mockResolvedValue([]);

      const result = await controller.getVillages();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.timestamp).toBe('string');
    });

    it('timestamp should be ISO-8601 format', async () => {
      mockAppApiService.getVillages.mockResolvedValue([]);

      const result = await controller.getVillages();

      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(result.timestamp).toMatch(isoRegex);
    });
  });
});
