import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SensorService', () => {
  let service: SensorService;
  let prismaService: PrismaService;

  const mockSensor = {
    id: 1,
    villageId: 1,
    sensorTypeId: 1,
    name: 'Temperature Sensor',
    infoText: 'Test sensor',
    isActive: true,
  };

  const mockPrismaService = {
    sensor: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    device: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensorService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SensorService>(SensorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new sensor', async () => {
      mockPrismaService.sensor.create.mockResolvedValue(mockSensor);
      mockPrismaService.device.findUnique.mockResolvedValue({ id: 2, villageId: 1 });

      const result = await service.create({
        villageId: 1,
        sensorTypeId: 1,
        name: 'Temperature Sensor',
        infoText: 'Test sensor',
        deviceId: 2,
      });

      expect(result).toEqual(mockSensor);
      expect(prismaService.sensor.create).toHaveBeenCalledWith({
        data: {
          villageId: 1,
          sensorTypeId: 1,
          name: 'Temperature Sensor',
          infoText: 'Test sensor',
          deviceId: 2,
          latitude: null,
          longitude: null,
        },
        include: { device: true, sensorType: true, status: true },
      });
    });

    it('throws when device belongs to different village', async () => {
      mockPrismaService.device.findUnique.mockResolvedValue({ id: 3, villageId: 9 });

      await expect(
        service.create({
          villageId: 1,
          sensorTypeId: 1,
          name: 'Bad',
          deviceId: 3,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('listByVillage', () => {
    it('should return sensors for a village', async () => {
      const villageId = 1;
      const mockSensors = [mockSensor];

      mockPrismaService.sensor.findMany.mockResolvedValue(mockSensors);

      const result = await service.listByVillage(villageId);

      expect(result).toEqual(mockSensors);
      expect(prismaService.sensor.findMany).toHaveBeenCalledWith({
        where: { villageId },
        include: { sensorType: true, status: true, device: true },
        orderBy: { id: 'asc' },
      });
    });

    it('should return empty array if village has no sensors', async () => {
      const villageId = 999;

      mockPrismaService.sensor.findMany.mockResolvedValue([]);

      const result = await service.listByVillage(villageId);

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return a sensor by id', async () => {
      mockPrismaService.sensor.findUnique.mockResolvedValue(mockSensor);

      const result = await service.getById(1);

      expect(result).toEqual(mockSensor);
      expect(prismaService.sensor.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { sensorType: true, village: true, status: true, device: true },
      });
    });
  });

  describe('update', () => {
    it('should update a sensor', async () => {
      const updateData = { name: 'Updated Sensor Name' };
      const updatedSensor = { ...mockSensor, name: 'Updated Sensor Name' };

      mockPrismaService.sensor.update.mockResolvedValue(updatedSensor);
      mockPrismaService.device.findUnique.mockResolvedValue({ id: 3, villageId: 1 });
      mockPrismaService.sensor.findUnique.mockResolvedValue({ id: 1, villageId: 1 });

      const result = await service.update(1, updateData);

      expect(result).toEqual(updatedSensor);
      expect(prismaService.sensor.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Sensor Name',
        },
        include: { device: true, sensorType: true, status: true },
      });
    });
  });
});
