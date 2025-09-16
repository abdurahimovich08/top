import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { BookingStatus, PaymentStatus, EscrowStatus, UserRole } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly mockProvider: MockPaymentProvider) {}

  async createPaymentIntent(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { package: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.customerId !== userId) {
      throw new ForbiddenException();
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay for a cancelled booking');
    }

    let payment = await this.prisma.payment.findUnique({ where: { bookingId } });
    if (!payment) {
      const intent = this.mockProvider.createIntent(Number(booking.price), booking.currency);
      payment = await this.prisma.payment.create({
        data: {
          bookingId,
          amount: booking.price,
          currency: booking.currency,
          status: PaymentStatus.PENDING,
          provider: 'MOCK',
          transactionRef: intent.paymentId,
        },
      });

      await this.prisma.escrow.create({
        data: {
          bookingId,
          paymentId: payment.id,
          status: EscrowStatus.HELD,
        },
      });
      return { payment, clientSecret: intent.clientSecret };
    }

    return { payment, clientSecret: `${payment.transactionRef}_secret` };
  }

  async confirmPayment(userId: string, bookingId: string, success: boolean) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.customerId !== userId) {
      throw new ForbiddenException();
    }

    const payment = await this.prisma.payment.findUnique({ where: { bookingId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: success ? PaymentStatus.AUTHORIZED : PaymentStatus.FAILED },
    });
  }

  async releaseEscrow(userId: string, bookingId: string, role: UserRole) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (role !== UserRole.PROVIDER && role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking must be completed before releasing payment');
    }

    const payment = await this.prisma.payment.findUnique({ where: { bookingId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.prisma.escrow.updateMany({
      where: { bookingId },
      data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
    });

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SETTLED },
    });
  }

  async refundPayment(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { bookingId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.prisma.escrow.updateMany({
      where: { bookingId },
      data: { status: EscrowStatus.REFUNDED, refundedAt: new Date() },
    });

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED },
    });
  }
}
