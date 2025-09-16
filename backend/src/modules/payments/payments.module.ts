import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentProvider, RolesGuard],
  exports: [PaymentsService],
})
export class PaymentsModule {}
