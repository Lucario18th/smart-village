import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  await app.listen(8000);
  console.log('Backend listening on http://0.0.0.0:8000');
}

bootstrap();
