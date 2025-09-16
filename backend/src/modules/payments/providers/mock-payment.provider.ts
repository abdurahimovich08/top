import { Injectable } from '@nestjs/common';

export interface PaymentIntent {
  clientSecret: string;
  paymentId: string;
}

@Injectable()
export class MockPaymentProvider {
  createIntent(amount: number, currency: string): PaymentIntent {
    const reference = `pm_${Math.random().toString(36).substring(2, 10)}`;
    return {
      clientSecret: `${reference}_secret`,
      paymentId: reference,
    };
  }
}
