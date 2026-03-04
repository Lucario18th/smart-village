import { Test, TestingModule } from '@nestjs/testing';
import { SensorReadingController } from './sensor-reading.controller';
import { SensorReadingService } from './sensor-reading.service';

describe('SensorReadingController', () => {
  let controller: SensorReadingController;
  let readingService: SensorReadingService;

  const mockReadingService = {
    createReadings: jest.fn(),
    listReadings: jest.fn(),
    timeseries: jest.fn(),
    summary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SensorReadingController],
      providers: [
        { provide: SensorReadingService, useValue: mockReadingService },
      ],
    }).compile();

    controller = module.get<SensorReadingController>(SensorReadingController);
    readingService = module.get<SensorReadingService>(SensorReadingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create sensor readings from single reading', async () => {
      const sensorId = 1;
      const body = { ts: '2024-01-01T10:00:00Z', value: 23.5 };

      mockReadingService.createReadings.mockResolvedValue({ created: 1 });

      const result = await controller.create(sensorId, body);

      expect(result).toEqual({ created: 1 });
      expect(readingService.createReadings).toHaveBeenCalledWith(sensorId, [
        body,
      ]);
    });

    it('should create sensor readings from array', async () => {
      const sensorId = 1;
      const body = {
        readings: [
          { ts: '2024-01-01T10:00:00Z', value: 23.5 },
          { ts: '2024-01-01T11:00:00Z', value: 24.2 },
        ],
      };

      mockReadingService.createReadings.mockResolvedValue({ created: 2 });

      const result = await controller.create(sensorId, body);

      expect(result).toEqual({ created: 2 });
      expect(readingService.createReadings).toHaveBeenCalledWith(
        sensorId,
        body.readings,
      );
    });
  });

  describe('list', () => {
    it('should list readings for a sensor', async () => {
      const sensorId = 1;
      const mockReadings = [
        {
          id: 1,
          sensorId,
          ts: new Date(),
          value: 23.5,
          status: 'OK',
          extra: null,
        },
      ];

      mockReadingService.listReadings.mockResolvedValue(mockReadings);

      const result = await controller.list(sensorId);

      expect(result).toEqual(mockReadings);
      expect(readingService.listReadings).toHaveBeenCalledWith(
        sensorId,
        undefined,
        undefined,
        1000,
        'desc',
      );
    });

    it('should list readings with filters', async () => {
      const sensorId = 1;
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-31T23:59:59Z';
      const mockReadings: any[] = [];

      mockReadingService.listReadings.mockResolvedValue(mockReadings);

      const result = await controller.list(sensorId, from, to, '100', 'asc');

      expect(result).toEqual(mockReadings);
      expect(readingService.listReadings).toHaveBeenCalledWith(
        sensorId,
        from,
        to,
        100,
        'asc',
      );
    });
  });

  describe('summary', () => {
    it('should return summary statistics', async () => {
      const sensorId = 1;
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-31T23:59:59Z';

      const mockSummary = {
        from,
        to,
        min: 20,
        max: 30,
        avg: 25,
        count: 100,
        last: 28,
        lastTimestamp: new Date(to),
      };

      mockReadingService.summary.mockResolvedValue(mockSummary);

      const result = await controller.summary(sensorId, from, to);

      expect(result).toEqual(mockSummary);
      expect(readingService.summary).toHaveBeenCalledWith(sensorId, from, to);
    });
  });

  describe('timeseries', () => {
    it('should return timeseries data', async () => {
      const sensorId = 1;
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-31T23:59:59Z';
      const bucket = '1 day';

      const mockTimeseries = [
        {
          bucketStart: new Date('2024-01-01'),
          valueMin: 20,
          valueMax: 30,
          valueAvg: 25,
          count: 10,
        },
      ];

      mockReadingService.timeseries.mockResolvedValue(mockTimeseries);

      const result = await controller.timeseries(sensorId, from, to, bucket);

      expect(result).toEqual(mockTimeseries);
      expect(readingService.timeseries).toHaveBeenCalledWith(
        sensorId,
        from,
        to,
        bucket,
      );
    });
  });
});
