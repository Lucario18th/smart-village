import { Test, TestingModule } from '@nestjs/testing';
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

      const result = await service.create(1, 1, 'Temperature Sensor', 'Test sensor');

      expect(result).toEqual(mockSensor);
      expect(prismaService.sensor.create).toHaveBeenCalledWith({
        data: {
          villageId: 1,
          sensorTypeId: 1,
          name: 'Temperature Sensor',
          infoText: 'Test sensor',
        },
      });
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
        include: { sensorType: true, status: true },
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
        include: { sensorType: true, village: true, status: true },
      });
    });
  });

  describe('update', () => {
    it('should update a sensor', async () => {
      const updateData = { name: 'Updated Sensor Name' };
      const updatedSensor = { ...mockSensor, name: 'Updated Sensor Name' };

      mockPrismaService.sensor.update.mockResolvedValue(updatedSensor);

      const result = await service.update(1, updateData);

      expect(result).toEqual(updatedSensor);
      expect(prismaService.sensor.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });
  });
});
