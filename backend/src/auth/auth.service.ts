import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { EmailService } from "./email.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private getFrontendBaseUrl() {
    return process.env.FRONTEND_URL || "http://localhost:3000";
  }

  private getBackendBaseUrl() {
    const base = process.env.BACKEND_URL || "http://localhost:8000/api/";
    return base.endsWith("/") ? base : `${base}/`;
  }

  private async generateVerificationToken(accountId: number, email: string) {
    return this.jwtService.signAsync(
      { sub: accountId, email, purpose: "email-verification" },
      { expiresIn: "5m" },
    );
  }

  private buildVerificationUrl(token: string) {
    const url = new URL("auth/verify", this.getBackendBaseUrl());
    url.searchParams.set("token", token);
    return url.toString();
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.account.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const account = await this.prisma.account.create({
      data: {
        email: dto.email,
        passwordHash,
        emailVerified: false,
        villages: {
          create: {
            name: dto.villageName ?? "",
            locationName: dto.locationName ?? "",
            phone: dto.phone ?? "",
            infoText: dto.infoText ?? "",
            contactEmail: dto.contactEmail ?? dto.email, // Default to email if not provided
            contactPhone: dto.contactPhone ?? "",
            municipalityCode: dto.municipalityCode ?? "",
          },
        },
      },
      include: { villages: true },
    });

    const verificationToken = await this.generateVerificationToken(
      account.id,
      account.email,
    );

    const verificationUrl = this.buildVerificationUrl(verificationToken);
    await this.emailService.sendVerificationEmail(account.email, verificationUrl);

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

    const payload = { sub: account.id, email: account.email };

    const token = await this.jwtService.signAsync(payload);

    return {
      accessToken: token,
    };
  }

  async getMe(accountId: number) {
    return this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        villages: true,
      },
    });
  }

  async verifyEmailToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (!payload?.sub || payload?.purpose !== "email-verification") {
        return { success: false, reason: "invalid" as const };
      }

      const account = await this.prisma.account.findUnique({
        where: { id: payload.sub },
      });

      if (!account) {
        return { success: false, reason: "not_found" as const };
      }

      if (!account.emailVerified) {
        await this.prisma.account.update({
          where: { id: account.id },
          data: { emailVerified: true },
        });
      }

      return { success: true };
    } catch (error) {
      if ((error as any)?.name === "TokenExpiredError") {
        return { success: false, reason: "expired" as const };
      }
      return { success: false, reason: "invalid" as const };
    }
  }

  buildVerificationRedirectUrl(result: { success: boolean; reason?: string }) {
    const url = new URL(this.getFrontendBaseUrl());
    url.searchParams.set("verification", result.success ? "success" : "failed");
    if (!result.success && result.reason) {
      url.searchParams.set("reason", result.reason);
    }
    return url.toString();
  }
}
