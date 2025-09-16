import { Booking, Service, ServicePackage, Address } from '@prisma/client';

const toNumber = (value?: any) => (value !== undefined && value !== null ? Number(value) : null);

export class BookingPresenter {
  static toHttp(
    booking: Booking & { service?: Service; package?: ServicePackage; address?: Address },
  ) {
    return {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      durationMinutes: booking.durationMinutes,
      notes: booking.notes,
      price: toNumber(booking.price),
      currency: booking.currency,
      service: booking.service
        ? {
            id: booking.service.id,
            title: booking.service.title,
            coverImageUrl: booking.service.coverImageUrl,
          }
        : undefined,
      package: booking.package
        ? {
            id: booking.package.id,
            name: booking.package.name,
            price: toNumber(booking.package.price),
            currency: booking.package.currency,
            durationMinutes: booking.package.durationMinutes,
          }
        : undefined,
      address: booking.address
        ? {
            id: booking.address.id,
            line1: booking.address.line1,
            city: booking.address.city,
            country: booking.address.country,
          }
        : undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}
