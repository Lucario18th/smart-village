import { Test, TestingModule } from '@nestjs/testing';
import { VillageController } from './village.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SensorService } from '../sensor/sensor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';

describe('VillageController', () => {
  let controller: VillageController;

  const mockPrismaService = {
    village: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    postalCode: {
      findUnique: jest.fn(),
    },
    villageFeatures: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockSensorService = {
    listByVillage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VillageController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SensorService, useValue: mockSensorService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VillageController>(VillageController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVillageFeatures', () => {
    it('should return features for a village', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.villageFeatures.findUnique.mockResolvedValue({
        villageId: 1,
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
      });

      const result = await controller.getVillageFeatures(1);

      expect(result.villageId).toBe(1);
      expect(result.enableSensorData).toBe(true);
      expect(result.enableWeather).toBe(false);
      expect(result.showSensorDescription).toBe(false);
      expect(result.showSensorCoordinates).toBe(true);
    });

    it('should return defaults when no features exist', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue({ id: 2 });
      mockPrismaService.villageFeatures.findUnique.mockResolvedValue(null);

      const result = await controller.getVillageFeatures(2);

      expect(result.villageId).toBe(2);
      expect(result.enableSensorData).toBe(true);
      expect(result.enableWeather).toBe(true);
      expect(result.enableMap).toBe(true);
      expect(result.showSensorName).toBe(true);
      expect(result.showSensorType).toBe(true);
      expect(result.showSensorDescription).toBe(true);
      expect(result.showSensorCoordinates).toBe(true);
    });

    it('should throw BadRequestException for non-existent village', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue(null);

      await expect(controller.getVillageFeatures(999)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateVillageFeatures', () => {
    it('should update features via upsert', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.villageFeatures.upsert.mockResolvedValue({
        villageId: 1,
        enableSensorData: true,
        enableWeather: false,
        enableMessages: true,
        enableEvents: true,
        enableMap: true,
        enableRideShare: false,
        enableTextileContainers: false,
        showSensorName: true,
        showSensorType: false,
        showSensorDescription: true,
        showSensorCoordinates: false,
      });

      const result = await controller.updateVillageFeatures(1, {
        enableWeather: false,
        enableEvents: true,
        enableRideShare: false,
        showSensorType: false,
        showSensorCoordinates: false,
      });

      expect(result.villageId).toBe(1);
      expect(result.enableWeather).toBe(false);
      expect(result.enableEvents).toBe(true);
      expect(result.showSensorType).toBe(false);
      expect(result.showSensorCoordinates).toBe(false);

      expect(mockPrismaService.villageFeatures.upsert).toHaveBeenCalledWith({
        where: { villageId: 1 },
        update: {
          enableWeather: false,
          enableEvents: true,
          enableRideShare: false,
          showSensorType: false,
          showSensorCoordinates: false,
        },
        create: {
          villageId: 1,
          enableWeather: false,
          enableEvents: true,
          enableRideShare: false,
          showSensorType: false,
          showSensorCoordinates: false,
        },
      });
    });

    it('should throw BadRequestException for non-existent village', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue(null);

      await expect(
        controller.updateVillageFeatures(999, { enableWeather: false }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
