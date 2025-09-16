import { Provider, Review, Service, ServiceMedia, ServicePackage, User } from '@prisma/client';

const toNumber = (value?: any) => (value !== undefined && value !== null ? Number(value) : null);

export class ServicePresenter {
  static toListItem(
    service: Service & { provider?: Provider; packages?: ServicePackage[]; media?: ServiceMedia[] },
  ) {
    return {
      id: service.id,
      title: service.title,
      description: service.description,
      coverImageUrl: service.coverImageUrl,
      priceFrom: toNumber(service.priceFrom),
      currency: service.currency,
      averageRating: service.averageRating,
      totalReviews: service.totalReviews,
      isPublished: service.isPublished,
      provider: service.provider
        ? {
            id: service.provider.id,
            businessName: service.provider.businessName,
            headline: service.provider.headline,
            averageRating: service.provider.averageRating,
          }
        : undefined,
      packages: service.packages?.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        price: toNumber(pkg.price),
        currency: pkg.currency,
        durationMinutes: pkg.durationMinutes,
      })),
      media: service.media?.map((media) => ({
        id: media.id,
        url: media.url,
        type: media.type,
        isPrimary: media.isPrimary,
      })),
      tags: service.tags,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }

  static toDetail(
    service: Service & {
      provider: Provider & { user?: User };
      packages: ServicePackage[];
      media: ServiceMedia[];
      reviews: (Review & { customer: User })[];
    },
  ) {
    return {
      ...ServicePresenter.toListItem(service),
      provider: {
        id: service.provider.id,
        businessName: service.provider.businessName,
        headline: service.provider.headline,
        averageRating: service.provider.averageRating,
        totalReviews: service.provider.totalReviews,
        kycStatus: service.provider.kycStatus,
        user: service.provider.user
          ? {
              id: service.provider.user.id,
              firstName: service.provider.user.firstName,
              lastName: service.provider.user.lastName,
              phone: service.provider.user.phone,
              avatarUrl: service.provider.user.avatarUrl,
            }
          : undefined,
      },
      reviews: service.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        customer: {
          id: review.customer.id,
          firstName: review.customer.firstName,
          lastName: review.customer.lastName,
          avatarUrl: review.customer.avatarUrl,
        },
      })),
    };
  }
}
