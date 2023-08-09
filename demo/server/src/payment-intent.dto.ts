export class CreatePaymentIntentDTO {
  amount?: number;
  currency?: string;
  customer_id?: string;
}

export class ConfirmPaymentIntentDTO {
  paymentIntent: string;
  stripeId: string;
  shouldSavePaymentMethod: boolean;
}

export class CreateSetupIntentDTO {
  customer_id?: string;
}
