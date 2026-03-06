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
    verifyEmailToken: jest.fn(),
    buildVerificationRedirectUrl: jest.fn(),
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

  describe('verify', () => {
    it('should redirect with verification result', async () => {
      const mockResponse = {
        redirect: jest.fn(),
      };

      mockAuthService.verifyEmailToken.mockResolvedValue({ success: true });
      mockAuthService.buildVerificationRedirectUrl.mockReturnValue(
        'http://frontend.example.com/?verification=success',
      );

      await controller.verify('token', mockResponse as any);

      expect(authService.verifyEmailToken).toHaveBeenCalledWith('token');
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://frontend.example.com/?verification=success',
      );
    });
  });
});
