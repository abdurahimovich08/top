import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

interface JwtPayload {
  sub: string;
  role: UserRole;
}

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':bookingId/intent')
  async createIntent(@CurrentUser() user: JwtPayload, @Param('bookingId') bookingId: string) {
    const intent = await this.paymentsService.createPaymentIntent(user.sub, bookingId);
    return { data: intent };
  }

  @Post(':bookingId/confirm')
  async confirm(
    @CurrentUser() user: JwtPayload,
    @Param('bookingId') bookingId: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    const payment = await this.paymentsService.confirmPayment(user.sub, bookingId, dto.success);
    return { data: payment };
  }

  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @Post(':bookingId/release')
  async release(
    @CurrentUser() user: JwtPayload,
    @Param('bookingId') bookingId: string,
  ) {
    const payment = await this.paymentsService.releaseEscrow(user.sub, bookingId, user.role);
    return { data: payment };
  }

  @Roles(UserRole.ADMIN)
  @Post(':bookingId/refund')
  async refund(@Param('bookingId') bookingId: string) {
    const payment = await this.paymentsService.refundPayment(bookingId);
    return { data: payment };
  }
}
