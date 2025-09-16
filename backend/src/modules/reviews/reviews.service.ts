import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(userId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.customerId !== userId) {
      throw new ForbiddenException();
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Reviews can only be left after completion');
    }
    if (booking.review) {
      throw new BadRequestException('Booking already reviewed');
    }

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          bookingId: booking.id,
          customerId: userId,
          providerId: booking.providerId,
          serviceId: booking.serviceId,
          rating: dto.rating,
          comment: dto.comment,
        },
        include: { customer: true },
      });

      const aggregates = await tx.review.aggregate({
        where: { serviceId: booking.serviceId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await tx.service.update({
        where: { id: booking.serviceId },
        data: {
          averageRating: aggregates._avg.rating ?? 0,
          totalReviews: aggregates._count.rating,
        },
      });
      await tx.provider.update({
        where: { id: booking.providerId },
        data: {
          averageRating: aggregates._avg.rating ?? 0,
          totalReviews: aggregates._count.rating,
        },
      });

      return review;
    });
  }

  async listServiceReviews(serviceId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });
    return reviews;
  }

  async listMyReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });
  }
}
