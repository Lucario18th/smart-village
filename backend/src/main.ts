import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Optional, falls du /api/... haben willst
  app.setGlobalPrefix("api");

  // CORS, falls Frontend mal separat laufen sollte
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(8000);
}
bootstrap();
