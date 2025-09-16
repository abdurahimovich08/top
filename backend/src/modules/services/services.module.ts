import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, RolesGuard],
  exports: [ServicesService],
})
export class ServicesModule {}
