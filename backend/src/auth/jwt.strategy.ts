import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { getJwtSecret } from "./jwt-secret.util";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: any) {
    if (payload?.isAdmin) {
      const account = await this.prisma.account.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          isAdmin: true,
          activeAdminSessionId: true,
          activeAdminSessionExpiresAt: true,
        },
      });

      const hasValidSession =
        Boolean(account?.isAdmin) &&
        Boolean(account?.activeAdminSessionId) &&
        Boolean(account?.activeAdminSessionExpiresAt) &&
        account!.activeAdminSessionId === payload.sid &&
        account!.activeAdminSessionExpiresAt!.getTime() > Date.now();

      if (!hasValidSession) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: "Admin session expired or replaced.",
          error: "Unauthorized",
          code: "ADMIN_SESSION_INVALID",
        });
      }
    }

    return {
      sub: payload.sub,
      email: payload.email,
      isAdmin: payload.isAdmin,
      sid: payload.sid,
    };
  }
}
