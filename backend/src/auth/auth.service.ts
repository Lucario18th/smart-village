import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { EmailService } from "./email.service";
import { Account, AccountType, SecurityIncidentType } from "@prisma/client";
import { randomInt, randomUUID } from "crypto";
import { UpdateAccountSettingsDto } from "./dto/update-account-settings.dto";

type LoginContext = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  private static readonly VERIFICATION_CODE_TTL_MS = 5 * 60 * 1000;
  private static readonly VERIFICATION_CODE_MIN = 100_000;
  private static readonly VERIFICATION_CODE_MAX = 1_000_000;
  private static readonly DEFAULT_MAX_ADMIN_LOGIN_ATTEMPTS = 5;
  private static readonly DEFAULT_ADMIN_LOCKOUT_MS = 30 * 60 * 1000;
  private static readonly DEFAULT_ADMIN_SESSION_TTL_MS = 30 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private parseDurationToMs(
    value: string | undefined,
    fallbackMs: number,
  ): number {
    if (!value) {
      return fallbackMs;
    }

    const normalized = value.trim().toLowerCase();
    const match = normalized.match(/^(\d+)\s*(ms|s|m|h|d)?$/);
    if (!match) {
      return fallbackMs;
    }

    const amount = Number.parseInt(match[1], 10);
    const unit = match[2] ?? "ms";
    if (!Number.isFinite(amount) || amount <= 0) {
      return fallbackMs;
    }

    switch (unit) {
      case "ms":
        return amount;
      case "s":
        return amount * 1000;
      case "m":
        return amount * 60 * 1000;
      case "h":
        return amount * 60 * 60 * 1000;
      case "d":
        return amount * 24 * 60 * 60 * 1000;
      default:
        return fallbackMs;
    }
  }

  private getMaxAdminLoginAttempts(): number {
    const parsed = Number.parseInt(
      process.env.ADMIN_MAX_LOGIN_ATTEMPTS ?? "",
      10,
    );
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : AuthService.DEFAULT_MAX_ADMIN_LOGIN_ATTEMPTS;
  }

  private getAdminLockoutMs(): number {
    return this.parseDurationToMs(
      process.env.ADMIN_LOCKOUT_TTL,
      AuthService.DEFAULT_ADMIN_LOCKOUT_MS,
    );
  }

  private getAdminSessionTtlMs(): number {
    return this.parseDurationToMs(
      process.env.ADMIN_SESSION_TTL,
      AuthService.DEFAULT_ADMIN_SESSION_TTL_MS,
    );
  }

  private async logIncident(params: {
    type: SecurityIncidentType;
    success: boolean;
    reason?: string;
    accountId?: number;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.securityIncident.create({
        data: {
          type: params.type,
          success: params.success,
          reason: params.reason,
          accountId: params.accountId,
          email: params.email,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch {
      // Never break auth flow due to audit logging failure.
    }
  }

  private getLockoutUntil(): Date {
    return new Date(Date.now() + this.getAdminLockoutMs());
  }

  private getAdminSessionExpiresAt(): Date {
    return new Date(Date.now() + this.getAdminSessionTtlMs());
  }

  private isAdminLocked(account: Account): boolean {
    return Boolean(account.lockUntil && account.lockUntil.getTime() > Date.now());
  }

  private async registerAdminFailedAttempt(
    account: Account,
    context: LoginContext,
  ) {
    const maxAttempts = this.getMaxAdminLoginAttempts();
    const nextAttemptCount = account.failedLoginAttempts + 1;

    if (nextAttemptCount >= maxAttempts) {
      const lockUntil = this.getLockoutUntil();
      await this.prisma.account.update({
        where: { id: account.id },
        data: {
          failedLoginAttempts: 0,
          lockUntil,
        },
      });

      await this.logIncident({
        type: SecurityIncidentType.LOGIN_BLOCKED,
        success: false,
        reason: "Too many failed admin login attempts",
        accountId: account.id,
        email: account.email,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      throw new UnauthorizedException({
        statusCode: 401,
        message: "Too many failed login attempts. Account temporarily locked.",
        error: "Unauthorized",
        code: "ADMIN_ACCOUNT_LOCKED",
        lockedUntil: lockUntil.toISOString(),
      });
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        failedLoginAttempts: nextAttemptCount,
      },
    });

    await this.logIncident({
      type: SecurityIncidentType.LOGIN_FAILED,
      success: false,
      reason: `Invalid password (attempt ${nextAttemptCount}/${maxAttempts})`,
      accountId: account.id,
      email: account.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

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
    const accountType = dto.accountType ?? AccountType.MUNICIPAL;
    const isPublicAppApiEnabled =
      dto.isPublicAppApiEnabled ?? accountType === AccountType.MUNICIPAL;

    const account = await this.prisma.account.create({
      data: {
        email: dto.email,
        passwordHash,
        accountType,
        isPublicAppApiEnabled,
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

  async login(dto: LoginDto, context: LoginContext = {}) {
    const account = await this.prisma.account.findUnique({
      where: { email: dto.email },
    });

    if (!account) {
      await this.logIncident({
        type: SecurityIncidentType.LOGIN_FAILED,
        success: false,
        reason: "Unknown user",
        email: dto.email,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      throw new UnauthorizedException({
        statusCode: 401,
        message: "User does not exist",
        error: "Unauthorized",
        code: "USER_NOT_FOUND",
      });
    }

    if (account.isAdmin && this.isAdminLocked(account)) {
      await this.logIncident({
        type: SecurityIncidentType.LOGIN_BLOCKED,
        success: false,
        reason: "Account currently locked",
        accountId: account.id,
        email: account.email,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      throw new UnauthorizedException({
        statusCode: 401,
        message: "Admin account is temporarily locked.",
        error: "Unauthorized",
        code: "ADMIN_ACCOUNT_LOCKED",
        lockedUntil: account.lockUntil?.toISOString() ?? null,
      });
    }

    if (!account.emailVerified) {
      await this.sendOrResendVerificationCode(account);

      await this.logIncident({
        type: SecurityIncidentType.LOGIN_FAILED,
        success: false,
        reason: "Email not verified",
        accountId: account.id,
        email: account.email,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      throw new UnauthorizedException({
        statusCode: 401,
        message: "Please verify your email first",
        error: "Unauthorized",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const valid = await bcrypt.compare(dto.password, account.passwordHash);
    if (!valid) {
      if (account.isAdmin) {
        await this.registerAdminFailedAttempt(account, context);
      } else {
        await this.logIncident({
          type: SecurityIncidentType.LOGIN_FAILED,
          success: false,
          reason: "Invalid password",
          accountId: account.id,
          email: account.email,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
      }

      throw new UnauthorizedException({
        statusCode: 401,
        message: "Invalid password",
        error: "Unauthorized",
        code: "INVALID_PASSWORD",
      });
    }

    const adminSessionExpiresAt = this.getAdminSessionExpiresAt();
    let adminSessionId: string | null = null;

    if (account.isAdmin) {
      const hasActiveSession =
        Boolean(account.activeAdminSessionId) &&
        Boolean(account.activeAdminSessionExpiresAt) &&
        account.activeAdminSessionExpiresAt!.getTime() > Date.now();

      if (hasActiveSession) {
        await this.logIncident({
          type: SecurityIncidentType.ADMIN_SESSION_BLOCKED,
          success: false,
          reason: "Concurrent admin login blocked",
          accountId: account.id,
          email: account.email,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        throw new UnauthorizedException({
          statusCode: 401,
          message: "Admin account already has an active session.",
          error: "Unauthorized",
          code: "ADMIN_SESSION_ACTIVE",
          activeUntil: account.activeAdminSessionExpiresAt?.toISOString() ?? null,
        });
      }

      adminSessionId = randomUUID();
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null,
        activeAdminSessionId: adminSessionId,
        activeAdminSessionExpiresAt: account.isAdmin
          ? adminSessionExpiresAt
          : null,
        activeAdminSessionIp: account.isAdmin ? context.ipAddress ?? null : null,
      },
    });

    const payload: {
      sub: number;
      email: string;
      isAdmin: boolean;
      sid?: string;
    } = {
      sub: account.id,
      email: account.email,
      isAdmin: account.isAdmin,
    };

    if (adminSessionId) {
      payload.sid = adminSessionId;
    }

    const token = await this.jwtService.signAsync(payload);

    await this.logIncident({
      type: SecurityIncidentType.LOGIN_SUCCESS,
      success: true,
      accountId: account.id,
      email: account.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      accessToken: token,
      adminSessionExpiresAt:
        account.isAdmin && adminSessionId
          ? adminSessionExpiresAt.toISOString()
          : null,
    };
  }

  async getMe(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        villages: {
          include: {
            postalCode: true,
          },
        },
      },
    });

    if (!account) {
      throw new UnauthorizedException("User does not exist");
    }

    const { passwordHash, ...safeAccount } = account;
    return safeAccount;
  }

  async updateAccountSettings(accountId: number, dto: UpdateAccountSettingsDto) {
    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        accountType: dto.accountType,
        isPublicAppApiEnabled: dto.isPublicAppApiEnabled,
      },
      include: {
        villages: {
          include: {
            postalCode: true,
          },
        },
      },
    });

    const { passwordHash, ...safeAccount } = updated;
    return safeAccount;
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
      data: {
        passwordHash: newHash,
        activeAdminSessionId: null,
        activeAdminSessionExpiresAt: null,
        activeAdminSessionIp: null,
      },
    });

    return { success: true };
  }

  async logout(accountId: number, context: LoginContext = {}) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new UnauthorizedException("User does not exist");
    }

    if (account.isAdmin) {
      await this.prisma.account.update({
        where: { id: accountId },
        data: {
          activeAdminSessionId: null,
          activeAdminSessionExpiresAt: null,
          activeAdminSessionIp: null,
        },
      });
    }

    await this.logIncident({
      type: SecurityIncidentType.LOGOUT,
      success: true,
      accountId: account.id,
      email: account.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
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
