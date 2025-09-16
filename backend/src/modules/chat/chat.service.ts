import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.customerId !== senderId && booking.providerId !== (await this.getProviderId(senderId))) {
      throw new ForbiddenException();
    }

    return this.prisma.message.create({
      data: {
        bookingId: dto.bookingId,
        senderId,
        recipientId: dto.recipientId,
        content: dto.content,
      },
    });
  }

  async listMessages(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.customerId !== userId && booking.providerId !== (await this.getProviderId(userId))) {
      throw new ForbiddenException();
    }

    return this.prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async getProviderId(userId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    return provider?.id;
  }
}
