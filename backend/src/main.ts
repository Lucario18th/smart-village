import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import helmet from "helmet";

function parseCorsOrigins(frontendUrl?: string): string[] {
  if (!frontendUrl) {
    return ["https://localhost", "http://localhost"];
  }

  return frontendUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = parseCorsOrigins(process.env.FRONTEND_URL);

  app.use(helmet());

  // Optional, falls du /api/... haben willst
  app.setGlobalPrefix("api");

  // Validation Pipeline für DTO
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
  }));

  // CORS, falls Frontend mal separat laufen sollte
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(8000);
}
bootstrap();
