import { BookingsService } from '../src/modules/bookings/bookings.service';
import { BookingStatus, UserRole } from '@prisma/client';

const createPrismaMock = () => ({
  booking: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  provider: {
    findUnique: jest.fn(),
  },
  availabilitySlot: {
    update: jest.fn(),
    updateMany: jest.fn(),
  },
}) as any;

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new BookingsService(prisma);
  });

  it('prevents providers from confirming bookings they do not own', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'booking',
      customerId: 'customer',
      providerId: 'other-provider',
      status: BookingStatus.PENDING,
    });
    prisma.provider.findUnique.mockResolvedValue({ id: 'provider' });

    await expect(
      service.updateStatus('provider-user', UserRole.PROVIDER, 'booking', {
        status: BookingStatus.CONFIRMED,
      }),
    ).rejects.toThrowError();
  });

  it('marks slots available when cancelling bookings', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'booking',
      customerId: 'customer',
      providerId: 'provider',
      slotId: 'slot',
      status: BookingStatus.CONFIRMED,
    });
    prisma.provider.findUnique.mockResolvedValue({ id: 'provider' });
    prisma.booking.update.mockResolvedValue({ id: 'booking', status: BookingStatus.CANCELLED });

    await service.updateStatus('provider-user', UserRole.PROVIDER, 'booking', {
      status: BookingStatus.CANCELLED,
    });

    expect(prisma.availabilitySlot.update).toHaveBeenCalledWith({
      where: { id: 'slot' },
      data: { isBooked: false },
    });
  });
});
