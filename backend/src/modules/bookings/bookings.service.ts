import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus, UserRole } from '@prisma/client';
import { BookingQueryDto } from './dto/booking-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureAddressOwnership(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) {
      throw new ForbiddenException('Address not found for this user');
    }
    return address;
  }

  private generateReference() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BK-${Date.now()}-${random}`;
  }

  async createBooking(userId: string, dto: CreateBookingDto) {
    await this.ensureAddressOwnership(userId, dto.addressId);

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { provider: true },
    });
    if (!service || !service.isPublished) {
      throw new NotFoundException('Service not available');
    }

    const servicePackage = await this.prisma.servicePackage.findUnique({ where: { id: dto.packageId } });
    if (!servicePackage || servicePackage.serviceId !== service.id || !servicePackage.isActive) {
      throw new BadRequestException('Invalid service package selected');
    }

    let slotId: string | undefined;
    if (dto.slotId) {
      const slot = await this.prisma.availabilitySlot.findUnique({ where: { id: dto.slotId } });
      if (!slot || slot.serviceId !== service.id || slot.isBooked) {
        throw new BadRequestException('Selected slot is not available');
      }
      slotId = slot.id;
    }

    const scheduledAt = new Date(dto.scheduledAt);
    const booking = await this.prisma.$transaction(async (tx) => {
      if (slotId) {
        await tx.availabilitySlot.update({
          where: { id: slotId },
          data: { isBooked: true },
        });
      }

      return tx.booking.create({
        data: {
          reference: this.generateReference(),
          customerId: userId,
          providerId: service.providerId,
          serviceId: service.id,
          packageId: servicePackage.id,
          slotId,
          scheduledAt,
          durationMinutes: servicePackage.durationMinutes,
          addressId: dto.addressId,
          price: servicePackage.price,
          currency: servicePackage.currency,
          notes: dto.notes,
        },
        include: {
          service: true,
          package: true,
          address: true,
        },
      });
    });

    return booking;
  }

  async listCustomerBookings(userId: string, query: BookingQueryDto) {
    const { page = 1, limit = 20, status, from, to } = query;
    const where: Prisma.BookingWhereInput = { customerId: userId };
    if (status) where.status = status;
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: { service: true, package: true, address: true },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit } };
  }

  async listProviderBookings(userId: string, query: BookingQueryDto) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
      throw new ForbiddenException('Provider profile required');
    }
    const { page = 1, limit = 20, status, from, to } = query;
    const where: Prisma.BookingWhereInput = { providerId: provider.id };
    if (status) where.status = status;
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: { service: true, package: true, address: true },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit } };
  }

  private async findBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, package: true, address: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async updateStatus(
    userId: string,
    role: UserRole,
    bookingId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.findBooking(bookingId);

    if (role === UserRole.CUSTOMER && booking.customerId !== userId) {
      throw new ForbiddenException();
    }
    if (role === UserRole.PROVIDER) {
      const provider = await this.prisma.provider.findUnique({ where: { userId } });
      if (!provider || booking.providerId !== provider.id) {
        throw new ForbiddenException();
      }
    }

    const nextStatus = dto.status;
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking already completed or cancelled');
    }

    if (booking.status === BookingStatus.PENDING && nextStatus === BookingStatus.CONFIRMED) {
      if (role !== UserRole.PROVIDER) {
        throw new ForbiddenException('Only providers can confirm bookings');
      }
    } else if (nextStatus === BookingStatus.COMPLETED) {
      if (role !== UserRole.PROVIDER || booking.status !== BookingStatus.CONFIRMED) {
        throw new BadRequestException('Booking must be confirmed before completion');
      }
    } else if (nextStatus === BookingStatus.CANCELLED) {
      if (role !== UserRole.CUSTOMER && role !== UserRole.PROVIDER) {
        throw new ForbiddenException('Only customers or providers can cancel bookings');
      }
    } else {
      throw new BadRequestException('Unsupported booking status transition');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: nextStatus,
        cancelledAt:
          nextStatus === BookingStatus.CANCELLED ? new Date() : booking.cancelledAt ?? undefined,
        completedAt:
          nextStatus === BookingStatus.COMPLETED ? new Date() : booking.completedAt ?? undefined,
      },
      include: { service: true, package: true, address: true },
    });

    if (nextStatus === BookingStatus.CANCELLED && booking.slotId) {
      await this.prisma.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { isBooked: false },
      });
    }

    return updated;
  }

  async cancelBooking(userId: string, bookingId: string, dto: CancelBookingDto) {
    const booking = await this.findBooking(bookingId);
    const providerId = await this.getProviderId(userId);
    if (booking.customerId !== userId && booking.providerId !== providerId) {
      throw new ForbiddenException();
    }

    const cancelled = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        notes: dto.reason ?? booking.notes,
      },
      include: { service: true, package: true, address: true },
    });

    if (booking.slotId) {
      await this.prisma.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { isBooked: false },
      });
    }

    return cancelled;
  }

  private async getProviderId(userId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    return provider?.id;
  }
}
