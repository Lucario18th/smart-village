import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete("accounts/:accountId")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(204)
  async deleteAccount(@Param("accountId", ParseIntPipe) accountId: number) {
    await this.adminService.deleteAccount(accountId);
  }
}
