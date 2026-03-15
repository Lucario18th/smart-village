import { Test, TestingModule } from '@nestjs/testing';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';

describe('DeviceController', () => {
  let controller: DeviceController;
  const mockDeviceService = {
    listByVillage: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [{ provide: DeviceService, useValue: mockDeviceService }],
    }).compile();

    controller = module.get<DeviceController>(DeviceController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists devices for a village', async () => {
    mockDeviceService.listByVillage.mockResolvedValue([{ id: 1 }]);

    const result = await controller.listByVillage(2);

    expect(result).toEqual([{ id: 1 }]);
    expect(mockDeviceService.listByVillage).toHaveBeenCalledWith(2);
  });

  it('creates a device with coordinates', async () => {
    const payload = {
      id: 3,
      deviceId: 'hw-123',
      villageId: 1,
      latitude: 52.1,
      longitude: 9.1,
    };
    mockDeviceService.create.mockResolvedValue(payload);

    const result = await controller.create(1, 'hw-123', 'Main controller', 52.1, 9.1);

    expect(result).toEqual(payload);
    expect(mockDeviceService.create).toHaveBeenCalledWith({
      villageId: 1,
      deviceId: 'hw-123',
      name: 'Main controller',
      latitude: 52.1,
      longitude: 9.1,
    });
  });

  it('updates device location', async () => {
    const updated = { id: 4, latitude: 1.0, longitude: 2.0 };
    mockDeviceService.update.mockResolvedValue(updated);

    const result = await controller.update(4, undefined, '1.0' as any, '2.0' as any);

    expect(result).toEqual(updated);
    expect(mockDeviceService.update).toHaveBeenCalledWith(4, {
      name: undefined,
      latitude: 1.0,
      longitude: 2.0,
    });
  });
});
