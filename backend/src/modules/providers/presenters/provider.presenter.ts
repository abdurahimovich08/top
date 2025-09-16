import { Provider, ProviderCategory } from '@prisma/client';

export class ProviderPresenter {
  static toHttp(provider: Provider & { categories?: ProviderCategory[] }) {
    return {
      id: provider.id,
      businessName: provider.businessName,
      bio: provider.bio,
      headline: provider.headline,
      kycStatus: provider.kycStatus,
      kycSubmittedAt: provider.kycSubmittedAt,
      verifiedAt: provider.verifiedAt,
      averageRating: provider.averageRating,
      totalReviews: provider.totalReviews,
      categories: provider.categories?.map((pivot) => pivot.categoryId),
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}
