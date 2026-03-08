import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AppApiController } from './app-api.controller';
import { AppApiService } from './app-api.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppApiController],
  providers: [AppApiService],
})
export class AppApiModule {}
