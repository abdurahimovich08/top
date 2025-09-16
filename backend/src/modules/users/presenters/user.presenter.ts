import { User, Address } from '@prisma/client';

export class UserPresenter {
  static toHttp(user: User & { addresses?: Address[] }) {
    const { passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      addresses: user.addresses?.map((address) => ({
        id: address.id,
        label: address.label,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        latitude: address.latitude,
        longitude: address.longitude,
        isPrimary: address.isPrimary,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
      })),
    };
  }
}
