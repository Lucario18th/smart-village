import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockAccount = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    lastLoginAt: null,
  };

  const mockPrismaService = {
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new account', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        villageName: 'Test Village',
        locationName: 'Test Location',
        phone: '123456789',
        infoText: 'Test info',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.account.create.mockResolvedValue({
        ...mockAccount,
        email: registerDto.email,
        villages: [{ id: 1, name: registerDto.villageName }],
      });

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(registerDto.email);
      expect(prismaService.account.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
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

    it('should throw error if account not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error if password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
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
        include: { villages: true },
      });
    });
  });
});
