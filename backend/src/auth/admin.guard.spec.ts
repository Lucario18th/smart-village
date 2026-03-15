import { AdminGuard } from './admin.guard'
import { PrismaService } from '../prisma/prisma.service'
import { ForbiddenException } from '@nestjs/common'

describe('AdminGuard', () => {
  const mockPrisma = {
    account: {
      findUnique: jest.fn(),
    },
  }

  const guard = new AdminGuard(mockPrisma as unknown as PrismaService)

  const mockContext = (sub?: number) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: sub ? { sub } : undefined }),
      }),
    } as any)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('allows admin users', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 1, isAdmin: true })

    await expect(guard.canActivate(mockContext(1))).resolves.toBe(true)
    expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it('blocks non-admin users', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 2, isAdmin: false })

    await expect(guard.canActivate(mockContext(2))).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('blocks missing user context', async () => {
    await expect(guard.canActivate(mockContext(undefined))).rejects.toBeInstanceOf(
      ForbiddenException,
    )
  })
})
