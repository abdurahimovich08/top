import { Review, User } from '@prisma/client';

export class ReviewPresenter {
  static toHttp(review: Review & { customer?: User }) {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      customer: review.customer
        ? {
            id: review.customer.id,
            firstName: review.customer.firstName,
            lastName: review.customer.lastName,
            avatarUrl: review.customer.avatarUrl,
          }
        : undefined,
    };
  }
}
