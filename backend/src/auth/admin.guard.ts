import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub?: number };

    if (!user?.sub) {
      throw new ForbiddenException("Admin privileges required");
    }

    const account = await this.prisma.account.findUnique({
      where: { id: user.sub },
    });

    if (!account?.isAdmin) {
      throw new ForbiddenException("Admin privileges required");
    }

    return true;
  }
}
