import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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
        villages: {
          create: {
            name: dto.villageName ?? "",
            locationName: dto.locationName ?? "",
            phone: dto.phone ?? "",
            infoText: dto.infoText ?? "",
          },
        },
      },
      include: { villages: true },
    });

    return account;
  }

  async login(dto: LoginDto) {
    const account = await this.prisma.account.findUnique({
      where: { email: dto.email },
    });

    if (!account) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, account.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
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
}
