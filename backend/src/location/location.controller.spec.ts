import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('LocationController', () => {
  let controller: LocationController;
  const mockPrisma = {
    postalCode: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<LocationController>(LocationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reject empty query', async () => {
    await expect(controller.search('')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return mapped results', async () => {
    mockPrisma.postalCode.findMany.mockResolvedValue([
      { id: 1, postalCode: '10115', city: 'Berlin', state: 'Berlin', lat: 52.5, lng: 13.3 },
    ]);

    const result = await controller.search('10115');

    expect(mockPrisma.postalCode.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { postalCode: { contains: '10115', mode: 'insensitive' } },
          { city: { contains: '10115', mode: 'insensitive' } },
        ],
      },
      orderBy: [{ postalCode: 'asc' }, { city: 'asc' }],
      take: 15,
    });
    expect(result).toEqual([
      { id: 1, postalCode: '10115', city: 'Berlin', state: 'Berlin', lat: 52.5, lng: 13.3 },
    ]);
  });
});
