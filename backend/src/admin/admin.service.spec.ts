import { AdminService } from './admin.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

describe('AdminService', () => {
  let service: AdminService
  const mockPrisma = {
    account: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    village: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    sensorReading: { deleteMany: jest.fn() },
    sensorStatus: { deleteMany: jest.fn() },
    sensor: { deleteMany: jest.fn() },
    message: { deleteMany: jest.fn() },
    rideShare: { deleteMany: jest.fn() },
    user: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma))
    service = new AdminService(mockPrisma as unknown as PrismaService)
  })

  it('throws when account missing', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null)
    await expect(service.deleteAccount(123)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('deletes account and related data', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 1 })
    mockPrisma.village.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }])

    await service.deleteAccount(1)

    expect(mockPrisma.village.findMany).toHaveBeenCalledWith({
      where: { accountId: 1 },
      select: { id: true },
    })
    expect(mockPrisma.sensorReading.deleteMany).toHaveBeenCalledWith({
      where: { sensor: { villageId: { in: [10, 11] } } },
    })
    expect(mockPrisma.sensorStatus.deleteMany).toHaveBeenCalledWith({
      where: { sensor: { villageId: { in: [10, 11] } } },
    })
    expect(mockPrisma.sensor.deleteMany).toHaveBeenCalledWith({
      where: { villageId: { in: [10, 11] } },
    })
    expect(mockPrisma.message.deleteMany).toHaveBeenCalledWith({
      where: { villageId: { in: [10, 11] } },
    })
    expect(mockPrisma.rideShare.deleteMany).toHaveBeenCalledWith({
      where: { villageId: { in: [10, 11] } },
    })
    expect(mockPrisma.user.deleteMany).toHaveBeenCalledWith({
      where: { villageId: { in: [10, 11] } },
    })
    expect(mockPrisma.village.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 11] } },
    })
    expect(mockPrisma.account.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})
