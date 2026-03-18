import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";
import { AssistantService } from "./assistant.service";
import { PrismaService } from "../prisma/prisma.service";

class AssistantAskDto {
  @IsString()
  @MinLength(2)
  @MaxLength(800)
  question!: string;

  @IsOptional()
  @IsObject()
  contextData?: Record<string, unknown>;
}

function parsePublicContext(contextData?: Record<string, unknown>): { locale: "de" | "en" | "fr"; villageId: number } {
  if (!contextData || typeof contextData !== "object") {
    throw new BadRequestException("contextData with locale is required for public assistant requests");
  }

  const locale = contextData.locale;
  if (locale !== "de" && locale !== "en" && locale !== "fr") {
    throw new BadRequestException("contextData.locale must be one of: de, en, fr");
  }

  const villageId = Number(contextData.villageId);
  if (!Number.isInteger(villageId) || villageId <= 0) {
    throw new BadRequestException("contextData.villageId must be a positive integer");
  }

  return { locale, villageId };
}

@Controller("assistant")
export class AssistantController {
  constructor(
    private readonly assistantService: AssistantService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("public/ask")
  async askPublic(@Body() body: AssistantAskDto) {
    const { villageId } = parsePublicContext(body.contextData);

    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: {
        id: true,
        account: { select: { isPublicAppApiEnabled: true } },
        features: { select: { enableUserAssistant: true } },
      },
    });

    if (!village || !village.account.isPublicAppApiEnabled) {
      throw new BadRequestException("Village not available for public assistant");
    }

    if (village.features && village.features.enableUserAssistant === false) {
      throw new ForbiddenException("User assistant is disabled by village admin");
    }

    const answer = await this.assistantService.ask({
      audience: "user",
      question: body.question,
      contextData: body.contextData,
    });

    return {
      answer,
      provider: "local-llm",
      audience: "user",
    };
  }

  @Post("admin/ask")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async askAdmin(@Body() body: AssistantAskDto, @Req() request: Request) {
    const user = request.user as { sub?: number } | undefined;
    if (!user?.sub) {
      throw new BadRequestException("Missing authenticated admin user");
    }

    const answer = await this.assistantService.ask({
      audience: "admin",
      question: body.question,
      contextData: body.contextData,
      actorId: user.sub,
    });

    return {
      answer,
      provider: "local-llm",
      audience: "admin",
    };
  }
}
