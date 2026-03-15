import { Test, TestingModule } from '@nestjs/testing';
import { DeviceService } from './device.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('DeviceService', () => {
  let service: DeviceService;
  const mockPrisma = {
    device: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists devices by village including sensors', async () => {
    mockPrisma.device.findMany.mockResolvedValue([{ id: 1 }]);

    const result = await service.listByVillage(3);

    expect(result).toEqual([{ id: 1 }]);
    expect(mockPrisma.device.findMany).toHaveBeenCalledWith({
      where: { villageId: 3 },
      orderBy: { id: 'asc' },
      include: { sensors: true },
    });
  });

  it('creates device with coordinates', async () => {
    mockPrisma.device.findUnique.mockResolvedValue(null);
    mockPrisma.device.create.mockResolvedValue({
      id: 10,
      deviceId: 'dev-1',
      villageId: 2,
      latitude: 48.2,
      longitude: 7.9,
    });

    const result = await service.create({
      villageId: 2,
      deviceId: 'dev-1',
      latitude: 48.2,
      longitude: 7.9,
    });

    expect(result.id).toBe(10);
    expect(mockPrisma.device.create).toHaveBeenCalledWith({
      data: {
        villageId: 2,
        deviceId: 'dev-1',
        name: null,
        latitude: 48.2,
        longitude: 7.9,
      },
    });
  });

  it('prevents duplicate deviceId', async () => {
    mockPrisma.device.findUnique.mockResolvedValue({ id: 1, deviceId: 'dup' });

    await expect(
      service.create({ villageId: 1, deviceId: 'dup' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates device location', async () => {
    mockPrisma.device.update.mockResolvedValue({
      id: 5,
      deviceId: 'dev-5',
      latitude: 1.1,
      longitude: 2.2,
      sensors: [],
    });

    const result = await service.update(5, { latitude: 1.1, longitude: 2.2 });

    expect(result.latitude).toBe(1.1);
    expect(mockPrisma.device.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { latitude: 1.1, longitude: 2.2 },
      include: { sensors: true },
    });
  });
});
