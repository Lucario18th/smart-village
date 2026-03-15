import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
    verifyEmailCode: jest.fn(),
    resendVerificationCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        postalCodeId: 10,
        villageName: 'Test Village',
        locationName: 'Test Location',
        phone: '123456789',
        infoText: 'Test info',
      };

      mockAuthService.register.mockResolvedValue({
        id: 1,
        email: registerDto.email,
      });

      const result = await controller.register(registerDto);

      expect(result).toBeDefined();
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue({ accessToken: 'jwt_token' });

      const result = await controller.login(loginDto);

      expect(result.accessToken).toBe('jwt_token');
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('me', () => {
    it('should return current user account', async () => {
      const mockRequest = {
        user: { sub: 1 },
      };

      const mockAccount = {
        id: 1,
        email: 'test@example.com',
        villages: [],
      };

      mockAuthService.getMe.mockResolvedValue(mockAccount);

      const result = await controller.me(mockRequest as any);

      expect(result).toEqual(mockAccount);
      expect(authService.getMe).toHaveBeenCalledWith(1);
    });
  });

  describe('verifyCode', () => {
    it('should delegate to authService.verifyEmailCode', async () => {
      mockAuthService.verifyEmailCode.mockResolvedValue({ success: true });

      const result = await controller.verifyCode({
        email: 'test@example.com',
        code: '123456',
      });

      expect(result).toEqual({ success: true });
      expect(authService.verifyEmailCode).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
      );
    });
  });

  describe('resendVerification', () => {
    it('should delegate to authService.resendVerificationCode', async () => {
      mockAuthService.resendVerificationCode.mockResolvedValue({ success: true });

      const result = await controller.resendVerification({
        email: 'test@example.com',
      });

      expect(result).toEqual({ success: true });
      expect(authService.resendVerificationCode).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });
});
