import { Test, TestingModule } from '@nestjs/testing';
import { SensorReadingService } from './sensor-reading.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SensorReadingService', () => {
  let service: SensorReadingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    sensorReading: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensorReadingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SensorReadingService>(SensorReadingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReadings', () => {
    it('should create multiple sensor readings', async () => {
      const sensorId = 1;
      const readings = [
        { ts: '2024-01-01T10:00:00Z', value: 23.5 },
        { ts: '2024-01-01T11:00:00Z', value: 24.2 },
      ];

      mockPrismaService.sensorReading.createMany.mockResolvedValue({
        count: 2,
      });

      const result = await service.createReadings(sensorId, readings);

      expect(result).toEqual({ created: 2 });
      expect(prismaService.sensorReading.createMany).toHaveBeenCalled();
    });

    it('should handle readings with status and extra data', async () => {
      const sensorId = 1;
      const readings = [
        {
          ts: '2024-01-01T10:00:00Z',
          value: 23.5,
          status: 'OK',
          extra: { humidity: 50 },
        },
      ];

      mockPrismaService.sensorReading.createMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.createReadings(sensorId, readings);

      expect(result).toEqual({ created: 1 });
    });
  });

  describe('listReadings', () => {
    it('should return readings for a sensor', async () => {
      const sensorId = 1;
      const mockReadings = [
        { id: 1, sensorId, ts: new Date(), value: 23.5, status: 'OK' },
      ];

      mockPrismaService.sensorReading.findMany.mockResolvedValue(mockReadings);

      const result = await service.listReadings(sensorId);

      expect(result).toEqual(mockReadings);
      expect(prismaService.sensorReading.findMany).toHaveBeenCalledWith({
        where: { sensorId },
        orderBy: { ts: 'desc' },
        take: 1000,
      });
    });

    it('should filter by time range', async () => {
      const sensorId = 1;
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-31T23:59:59Z';
      const mockReadings = [
        { id: 1, sensorId, ts: new Date(from), value: 23.5, status: 'OK' },
      ];

      mockPrismaService.sensorReading.findMany.mockResolvedValue(mockReadings);

      const result = await service.listReadings(sensorId, from, to);

      expect(result).toEqual(mockReadings);
      expect(prismaService.sensorReading.findMany).toHaveBeenCalled();
    });
  });

  describe('summary', () => {
    it('should return aggregated sensor data', async () => {
      const sensorId = 1;
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-31T23:59:59Z';

      mockPrismaService.sensorReading.groupBy.mockResolvedValue([
        {
          sensorId,
          _min: { value: 20 },
          _max: { value: 30 },
          _avg: { value: 25 },
          _count: { _all: 100 },
        },
      ]);

      mockPrismaService.sensorReading.findFirst.mockResolvedValue({
        id: 1,
        sensorId,
        ts: new Date(to),
        value: 28,
        status: 'OK',
        extra: null,
      });

      const result = await service.summary(sensorId, from, to);

      expect(result).toHaveProperty('min', 20);
      expect(result).toHaveProperty('max', 30);
      expect(result).toHaveProperty('avg', 25);
      expect(result).toHaveProperty('count', 100);
      expect(result).toHaveProperty('last', 28);
    });
  });
});
