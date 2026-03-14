import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { EmailService } from "./email.service";
import { Account } from "@prisma/client";
import { randomInt } from "crypto";

@Injectable()
export class AuthService {
  private static readonly VERIFICATION_CODE_TTL_MS = 5 * 60 * 1000;
  private static readonly VERIFICATION_CODE_MIN = 100_000;
  private static readonly VERIFICATION_CODE_MAX = 1_000_000;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private generateVerificationCode() {
    // randomInt upper bound is exclusive, yielding 100000-999999 as 6-digit codes
    return randomInt(
      AuthService.VERIFICATION_CODE_MIN,
      AuthService.VERIFICATION_CODE_MAX,
    ).toString();
  }

  private getVerificationExpiry() {
    return new Date(Date.now() + AuthService.VERIFICATION_CODE_TTL_MS);
  }

  private isVerificationCodeValid(account: Account) {
    return (
      Boolean(account.verificationCode) &&
      Boolean(account.verificationCodeExpiresAt) &&
      account.verificationCodeExpiresAt!.getTime() > Date.now()
    );
  }

  private async refreshVerificationCode(account: Account) {
    const code = this.generateVerificationCode();
    const expiresAt = this.getVerificationExpiry();

    await this.prisma.account.update({
      where: { id: account.id },
      data: { verificationCode: code, verificationCodeExpiresAt: expiresAt },
    });

    return { code, expiresAt };
  }

  private async ensureVerificationCode(account: Account) {
    if (this.isVerificationCodeValid(account)) {
      return {
        code: account.verificationCode!,
        expiresAt: account.verificationCodeExpiresAt!,
      };
    }

    return this.refreshVerificationCode(account);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.account.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException("Email already in use");
    }

    const postalCode = await this.prisma.postalCode.findUnique({
      where: { id: dto.postalCodeId },
    });

    if (!postalCode) {
      throw new UnauthorizedException("Invalid postal code selection");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiresAt = this.getVerificationExpiry();

    const account = await this.prisma.account.create({
      data: {
        email: dto.email,
        passwordHash,
        emailVerified: false,
        verificationCode,
        verificationCodeExpiresAt,
        villages: {
          create: {
            name: dto.villageName ?? postalCode.city,
            locationName:
              dto.locationName ?? `${postalCode.zipCode} ${postalCode.city}`,
            phone: dto.phone ?? "",
            infoText: dto.infoText ?? "",
            contactEmail: dto.contactEmail ?? dto.email, // Default to email if not provided
            contactPhone: dto.contactPhone ?? "",
            municipalityCode: dto.municipalityCode ?? "",
            postalCodeId: postalCode.id,
          },
        },
      },
      include: {
        villages: {
          include: {
            postalCode: true,
          },
        },
      },
    });

    await this.emailService.sendVerificationCodeEmail(
      account.email,
      verificationCode,
    );

    const { passwordHash: _hidden, ...safeAccount } = account;
    return { ...safeAccount, verificationSent: true };
  }

  async login(dto: LoginDto) {
    const account = await this.prisma.account.findUnique({
      where: { email: dto.email },
    });

    if (!account) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "User does not exist",
        error: "Unauthorized",
        code: "USER_NOT_FOUND",
      });
    }

    if (!account.emailVerified) {
      await this.sendOrResendVerificationCode(account);
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Please verify your email first",
        error: "Unauthorized",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const valid = await bcrypt.compare(dto.password, account.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Invalid password",
        error: "Unauthorized",
        code: "INVALID_PASSWORD",
      });
    }

    const payload = { sub: account.id, email: account.email, isAdmin: account.isAdmin };

    const token = await this.jwtService.signAsync(payload);

    return {
      accessToken: token,
    };
  }

  async getMe(accountId: number) {
    return this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        villages: {
          include: {
            postalCode: true,
          },
        },
      },
    });
  }

  private async sendOrResendVerificationCode(account: Account) {
    const { code } = await this.ensureVerificationCode(account);
    await this.emailService.sendVerificationCodeEmail(account.email, code);
  }

  async verifyEmailCode(email: string, code: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "User does not exist",
        error: "Unauthorized",
        code: "USER_NOT_FOUND",
      });
    }

    if (account.emailVerified) {
      return { success: true };
    }

    if (!account.verificationCode || !account.verificationCodeExpiresAt) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Verification code not found. Please request a new code.",
        error: "Unauthorized",
        code: "EMAIL_VERIFICATION_CODE_MISSING",
      });
    }

    if (account.verificationCodeExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Verification code has expired",
        error: "Unauthorized",
        code: "EMAIL_VERIFICATION_CODE_EXPIRED",
      });
    }

    if (account.verificationCode !== code) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Verification code is invalid",
        error: "Unauthorized",
        code: "EMAIL_VERIFICATION_CODE_INVALID",
      });
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    return { success: true };
  }

  async changePassword(
    accountId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "User does not exist",
        error: "Unauthorized",
        code: "USER_NOT_FOUND",
      });
    }

    const valid = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Current password is incorrect",
        error: "Unauthorized",
        code: "INVALID_PASSWORD",
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.account.update({
      where: { id: accountId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  }

  async resendVerificationCode(email: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "User does not exist",
        error: "Unauthorized",
        code: "USER_NOT_FOUND",
      });
    }

    if (account.emailVerified) {
      return { success: true, alreadyVerified: true };
    }

    const { code } = await this.refreshVerificationCode(account);
    await this.emailService.sendVerificationCodeEmail(account.email, code);

    return { success: true };
  }
}
