import { Test, TestingModule } from '@nestjs/testing'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

describe('AdminController', () => {
  let controller: AdminController
  const mockAdminService = { deleteAccount: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockAdminService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<AdminController>(AdminController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('delegates deletion to service', async () => {
    mockAdminService.deleteAccount.mockResolvedValue({ success: true })
    await controller.deleteAccount(5)
    expect(mockAdminService.deleteAccount).toHaveBeenCalledWith(5)
  })
})
