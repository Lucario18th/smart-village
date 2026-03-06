import { Body, Controller, Get, Post, Req, UseGuards, HttpCode, Query, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Request } from "express";
import { Response } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: Request) {
    const user = req.user as { sub: number };
    return this.authService.getMe(user.sub);
  }

  @Get("verify")
  async verify(@Query("token") token: string, @Res() res: Response) {
    const result = await this.authService.verifyEmailToken(token);
    const redirectUrl = this.authService.buildVerificationRedirectUrl(result);
    return res.redirect(redirectUrl);
  }
}
