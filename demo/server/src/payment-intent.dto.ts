export class ConfirmPaymentIntentDTO {
  paymentIntentId: string;
  stripeId: string;
  shouldSavePaymentMethod: boolean;
}

export class CreatePaymentIntentDTO {
  amount?: number;
  currency?: string;
  customer_id?: string;
}

export class CreateSetupIntentDTO {
  customer_id?: string;
}
