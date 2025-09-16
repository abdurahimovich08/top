import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [ProvidersController],
  providers: [ProvidersService, RolesGuard],
  exports: [ProvidersService],
})
export class ProvidersModule {}
