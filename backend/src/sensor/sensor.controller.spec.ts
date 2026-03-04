import { Test, TestingModule } from '@nestjs/testing';
import { SensorController } from './sensor.controller';
import { SensorService } from './sensor.service';

describe('SensorController', () => {
  let controller: SensorController;
  let sensorService: SensorService;

  const mockSensorService = {
    create: jest.fn(),
    listByVillage: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SensorController],
      providers: [{ provide: SensorService, useValue: mockSensorService }],
    }).compile();

    controller = module.get<SensorController>(SensorController);
    sensorService = module.get<SensorService>(SensorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new sensor', async () => {
      const mockSensor = {
        id: 1,
        villageId: 1,
        sensorTypeId: 1,
        name: 'Temperature Sensor',
        infoText: 'Test sensor',
        isActive: true,
      };

      mockSensorService.create.mockResolvedValue(mockSensor);

      const result = await controller.create(1, 1, 'Temperature Sensor', 'Test sensor');

      expect(result).toEqual(mockSensor);
      expect(sensorService.create).toHaveBeenCalledWith(1, 1, 'Temperature Sensor', 'Test sensor');
    });
  });

  describe('listByVillage', () => {
    it('should return sensors for a village', async () => {
      const mockSensors = [
        { id: 1, villageId: 1, name: 'Sensor 1', sensorTypeId: 1 },
      ];

      mockSensorService.listByVillage.mockResolvedValue(mockSensors);

      const result = await controller.listByVillage(1);

      expect(result).toEqual(mockSensors);
      expect(sensorService.listByVillage).toHaveBeenCalledWith(1);
    });
  });

  describe('getById', () => {
    it('should return a sensor by id', async () => {
      const mockSensor = {
        id: 1,
        villageId: 1,
        name: 'Temperature Sensor',
        sensorTypeId: 1,
        isActive: true,
      };

      mockSensorService.getById.mockResolvedValue(mockSensor);

      const result = await controller.getById(1);

      expect(result).toEqual(mockSensor);
      expect(sensorService.getById).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a sensor', async () => {
      const updateData = { name: 'Updated Sensor' };
      const mockSensor = {
        id: 1,
        villageId: 1,
        name: 'Updated Sensor',
        sensorTypeId: 1,
      };

      mockSensorService.update.mockResolvedValue(mockSensor);

      const result = await controller.update(1, updateData);

      expect(result).toEqual(mockSensor);
      expect(sensorService.update).toHaveBeenCalledWith(1, updateData);
    });
  });
});
