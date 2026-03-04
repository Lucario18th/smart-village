import { Module } from '@nestjs/common'
import { VillageController } from './village.controller'

@Module({
  controllers: [VillageController],
})
export class VillageModule {}
