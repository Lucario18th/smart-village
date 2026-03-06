import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;

  const now = new Date();
  const mockAccount = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    emailVerified: true,
    verificationCode: '123456',
    verificationCodeExpiresAt: new Date(now.getTime() + 5 * 60 * 1000),
    createdAt: now,
    lastLoginAt: null,
  };

  const mockPostalCode = {
    id: 10,
    postalCode: '10115',
    city: 'Berlin',
    state: 'Berlin',
    lat: 52.532,
    lng: 13.3849,
  };

  const mockPrismaService = {
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    postalCode: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationCodeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new account', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        postalCodeId: mockPostalCode.id,
        villageName: 'Test Village',
        locationName: 'Test Location',
        phone: '123456789',
        infoText: 'Test info',
      };

      const codeSpy = jest
        .spyOn<any, any>(service as any, 'generateVerificationCode')
        .mockReturnValue('999999');

      mockPrismaService.account.findUnique.mockResolvedValue(null);
      mockPrismaService.postalCode.findUnique.mockResolvedValue(mockPostalCode);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.account.create.mockResolvedValue({
        ...mockAccount,
        emailVerified: false,
        email: registerDto.email,
        verificationCode: '999999',
        verificationCodeExpiresAt: new Date(),
        villages: [{ id: 1, name: registerDto.villageName }],
      });

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(registerDto.email);
      expect(prismaService.account.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerDto.email,
          emailVerified: false,
          verificationCode: expect.any(String),
          verificationCodeExpiresAt: expect.any(Date),
          villages: expect.objectContaining({
            create: expect.objectContaining({
              postalCodeId: mockPostalCode.id,
            }),
          }),
        }),
        include: { villages: true },
      });
      expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledWith(
        registerDto.email,
        '999999',
      );
      expect(prismaService.account.create).toHaveBeenCalled();
      codeSpy.mockRestore();
    });

    it('should throw error if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        postalCodeId: mockPostalCode.id,
        villageName: 'Test Village',
        locationName: 'Test Location',
        phone: '123456789',
        infoText: 'Test info',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error if postal code is invalid', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        postalCodeId: 999,
      };

      mockPrismaService.account.findUnique.mockResolvedValue(null);
      mockPrismaService.postalCode.findUnique.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('jwt_token');

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('jwt_token');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockAccount.id,
        email: mockAccount.email,
      });
    });

    it('should block login when email is not verified', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockPrismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        emailVerified: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'EMAIL_NOT_VERIFIED',
        }),
      });
      expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledWith(
        loginDto.email,
        mockAccount.verificationCode,
      );
    });

    it('should generate and send a fresh code when missing during login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const accountWithoutCode = {
        ...mockAccount,
        emailVerified: false,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      };

      const codeSpy = jest
        .spyOn<any, any>(service as any, 'generateVerificationCode')
        .mockReturnValue('222222');

      mockPrismaService.account.findUnique.mockResolvedValue(accountWithoutCode);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.account.update.mockResolvedValue({
        ...accountWithoutCode,
        verificationCode: '222222',
        verificationCodeExpiresAt: new Date(),
      });

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'EMAIL_NOT_VERIFIED',
        }),
      });

      expect(prismaService.account.update).toHaveBeenCalledWith({
        where: { id: accountWithoutCode.id },
        data: expect.objectContaining({
          verificationCode: '222222',
        }),
      });
      expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledWith(
        loginDto.email,
        '222222',
      );
      codeSpy.mockRestore();
    });

    it('should refresh expired code during login and send it', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expiredAccount = {
        ...mockAccount,
        emailVerified: false,
        verificationCode: '111111',
        verificationCodeExpiresAt: new Date(Date.now() - 1000),
      };

      const codeSpy = jest
        .spyOn<any, any>(service as any, 'generateVerificationCode')
        .mockReturnValue('333333');

      mockPrismaService.account.findUnique.mockResolvedValue(expiredAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.account.update.mockResolvedValue({
        ...expiredAccount,
        verificationCode: '333333',
        verificationCodeExpiresAt: new Date(),
      });

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'EMAIL_NOT_VERIFIED',
        }),
      });

      expect(prismaService.account.update).toHaveBeenCalledWith({
        where: { id: expiredAccount.id },
        data: expect.objectContaining({
          verificationCode: '333333',
        }),
      });
      expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledWith(
        loginDto.email,
        '333333',
      );
      codeSpy.mockRestore();
    });

    it('should throw error if account not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'USER_NOT_FOUND',
          message: 'User does not exist',
        }),
      });
    });

    it('should throw error if password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'INVALID_PASSWORD',
          message: 'Invalid password',
        }),
      });
    });
  });

  describe('verifyEmailCode', () => {
    it('should verify code and update account', async () => {
      const account = {
        ...mockAccount,
        emailVerified: false,
        verificationCode: '654321',
        verificationCodeExpiresAt: new Date(Date.now() + 1_000),
      };
      mockPrismaService.account.findUnique.mockResolvedValue(account);

      const result = await service.verifyEmailCode(account.email, '654321');

      expect(result).toEqual({ success: true });
      expect(prismaService.account.update).toHaveBeenCalledWith({
        where: { id: account.id },
        data: {
          emailVerified: true,
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
      });
    });

    it('should throw when code is expired', async () => {
      const account = {
        ...mockAccount,
        emailVerified: false,
        verificationCode: '654321',
        verificationCodeExpiresAt: new Date(Date.now() - 1_000),
      };
      mockPrismaService.account.findUnique.mockResolvedValue(account);

      await expect(
        service.verifyEmailCode(account.email, '654321'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'EMAIL_VERIFICATION_CODE_EXPIRED',
        }),
      });
    });

    it('should throw when code is invalid', async () => {
      const account = {
        ...mockAccount,
        emailVerified: false,
        verificationCode: '654321',
        verificationCodeExpiresAt: new Date(Date.now() + 1_000),
      };
      mockPrismaService.account.findUnique.mockResolvedValue(account);

      await expect(
        service.verifyEmailCode(account.email, '123123'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'EMAIL_VERIFICATION_CODE_INVALID',
        }),
      });
    });
  });

  describe('resendVerificationCode', () => {
    it('should resend verification code for unverified accounts', async () => {
      const account = { ...mockAccount, emailVerified: false };
      mockPrismaService.account.findUnique.mockResolvedValue(account);
      const codeSpy = jest
        .spyOn<any, any>(service as any, 'generateVerificationCode')
        .mockReturnValue('777777');

      await service.resendVerificationCode(account.email);

      expect(prismaService.account.update).toHaveBeenCalledWith({
        where: { id: account.id },
        data: expect.objectContaining({
          verificationCode: '777777',
        }),
      });
      expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledWith(
        account.email,
        '777777',
      );
      codeSpy.mockRestore();
    });
  });

  describe('getMe', () => {
    it('should return account with villages', async () => {
      const accountId = 1;
      const mockAccountWithVillages = {
        ...mockAccount,
        villages: [{ id: 1, name: 'Test Village' }],
      };

      mockPrismaService.account.findUnique.mockResolvedValue(
        mockAccountWithVillages,
      );

      const result = await service.getMe(accountId);

      expect(result).toEqual(mockAccountWithVillages);
      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
        include: { villages: { include: { postalCode: true } } },
      });
    });
  });
});
