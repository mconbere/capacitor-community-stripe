interface CompleteConfirmPaymentSheetOptionClientSecret {
  /**
   * Set the client secret of the payment intent finalized on the server.
   */
  clientSecret: string;

  /**
   * error is not allowed when setting clientSecret.
   */
  error?: never;
}

interface CompleteConfirmPaymentSheetOptionError {
  /**
   * Set error to indicate there was an error confirming the payment intent on the server.
   */
  error: string;

  /**
   * clientSecret is not allowed when setting error.
   */
  clientSecret?: never;
}

export interface PaymentMethod {
  /**
   * Stripe identifier of the payment method.
   */
  id: string;
}

export type ConfirmPaymentSheetCallback = (message: {paymentMethod: PaymentMethod; shouldSavePaymentMethod: boolean}) => void;

export type ConfirmPaymentSheetCallbackID = string;

export type CompleteConfirmPaymentSheetOption = CompleteConfirmPaymentSheetOptionClientSecret | CompleteConfirmPaymentSheetOptionError

/**
 * @extends BasePaymentOption
 */
export interface CreatePaymentSheetOption extends BasePaymentOption {
  /**
   * Any documentation call 'paymentIntent'
   * Set paymentIntentClientSecret or setupIntentClientSecret
   */
  paymentIntentClientSecret?: string;

  /**
   * Any documentation call 'paymentIntent'
   * Set paymentIntentClientSecret or setupIntentClientSecret
   */
  setupIntentClientSecret?: string;

  /**
   * Set confirm on server.
   * If confirmOnServer is set to true, listen for Stripe.PaymentSheetEventsEnum.ConfirmOnServer event and perform a server confirmation. After server confirmation call Stripe.completeConfirmPaymentSheet with the resulting payment intent client secret or error.
   * @default false
   * @url https://stripe.com/docs/payments/finalize-payments-on-the-server
   */
  confirmOnServer?: boolean;

  /**
   * Set amount for confirmOnServer payment intent.
   * Amount intended to be collected in the smallest currency unit (e.g. 100 cents to charge $1.00). Shown in Apple Pay, Buy now pay later UIs, the Pay button, and influences available payment methods.
   * @url https://stripe.com/docs/api/payment_intents/create#create_payment_intent-amount
   */
  amount?: number;

  /**
   * Set currency for confirmOnServer. Required for payment intent, optional for setup intent.
   * Three-letter ISO currency code. Filters out payment methods based on supported currency.
   * @url https://stripe.com/docs/api/payment_intents/create#create_payment_intent-currency
   */
  currency?: string;

  /**
   * Set setupFutureUsage for confirmOnServer. Optional for payment intent, required for setup intent.
   * Indicates that you intend to make future payments with this PaymentIntent’s payment method.
   * @url https://stripe.com/docs/api/payment_intents/create#create_payment_intent-setup_future_usage
   */
  setupFutureUsage?: 'offSession' | 'onSession';

  /**
   * Set paymentMethodTypes for confirmOnServer.
   * A list of payment method types to display to the customer. If unset, Stripe dynamically determines the payment methods using account Dashboard settings.
   */
  paymentMethodTypes?: string[];

  /**
   * Set onBehalfOf for confirmOnServer.
   * The account (if any) for which the funds of the intent are intended.
   * @url https://stripe.com/docs/api/payment_intents/object#payment_intent_object-on_behalf_of
   */
  onBehalfOf?: string;

  /**
   * Set captureMethod.
   * Controls when the funds will be captured.
   * @default 'automatic'
   * @url https://stripe.com/docs/api/payment_intents/create#create_payment_intent-capture_method
   */
  captureMethod?: 'automatic' | 'manual' | 'automaticAsync';
}

/**
 * @extends BasePaymentOption
 */
export interface CreatePaymentFlowOption extends BasePaymentOption {
  /**
   * Any documentation call 'paymentIntent'
   * Set paymentIntentClientSecret or setupIntentClientSecret
   */
  paymentIntentClientSecret?: string;

  /**
   * Any documentation call 'paymentIntent'
   * Set paymentIntentClientSecret or setupIntentClientSecret
   */
  setupIntentClientSecret?: string;
}

export interface BasePaymentOption {

  /**
   * Any documentation call 'ephemeralKey'
   */
  customerEphemeralKeySecret?: string;

  /**
   * Any documentation call 'customer'
   */
  customerId?: string;

  /**
   * If you set payment method ApplePay, this set true
   * @default false
   * @url https://stripe.com/docs/payments/accept-a-payment?platform=ios&ui=payment-sheet
   */
  enableApplePay?: boolean;

  /**
   * If set enableApplePay false, Plugin ignore here.
   */
  applePayMerchantId?: string;

  /**
   * If you set payment method GooglePay, this set true
   * @default false
   * @url https://stripe.com/docs/payments/accept-a-payment?platform=android&ui=payment-sheet#google-pay
   */
  enableGooglePay?: boolean;

  /**
   * @default false,
   */
  GooglePayIsTesting?: boolean;

  /**
   * use ApplePay and GooglePay.
   * If set enableApplePay and enableGooglePay false, Plugin ignore here.
   * @default "US"
   */
  countryCode?: string;

  /**
   * @url https://stripe.com/docs/payments/accept-a-payment?platform=ios&ui=payment-sheet
   * @default "App Name"
   */
  merchantDisplayName?: string | undefined;

  /**
   * @url https://stripe.com/docs/payments/accept-a-payment?platform=ios&ui=payment-sheet#ios-set-up-return-url
   * @default ""
   */
  returnURL?: string | undefined;

  /**
   * iOS Only
   * @url https://stripe.com/docs/payments/accept-a-payment?platform=ios&ui=payment-sheet#userinterfacestyle
   * @default undefined
   */
  style?: 'alwaysLight' | 'alwaysDark';

  /**
   * Platform: Web only
   * Show ZIP code field.
   * @default true
   */
  withZipCode?: boolean
}

export interface CreateApplePayOption {
  paymentIntentClientSecret: string;
  paymentSummaryItems: {
    label: string;
    amount: number;
  }[];
  merchantIdentifier: string;
  countryCode: string;
  currency: string;
  requiredShippingContactFields?: ('postalAddress' | 'phoneNumber' | 'emailAddress' | 'name')[];
}

export interface CreateGooglePayOption {
  paymentIntentClientSecret: string;

  /**
   * Web only
   * need stripe-pwa-elements > 1.1.0
   */
  paymentSummaryItems?: {
    label: string;
    amount: number;
  }[];
  /**
   * Web only
   * need stripe-pwa-elements > 1.1.0
   */
  merchantIdentifier?: string;
  /**
   * Web only
   * need stripe-pwa-elements > 1.1.0
   */
  countryCode?: string;
  /**
   * Web only
   * need stripe-pwa-elements > 1.1.0
   */
  currency?: string;
}

// Apple doc: https://developer.apple.com/documentation/passkit/pkcontact
export interface DidSelectShippingContact {
  contact: ShippingContact;
}
export interface ShippingContact {
  /**
   * Apple Pay only
   */
  givenName?: string;
  /**
   * Apple Pay only
   */
  familyName?: string;
  /**
   * Apple Pay only
   */
  middleName?: string;
  /**
   * Apple Pay only
   */
  namePrefix?: string;
  /**
   * Apple Pay only
   */
  nameSuffix?: string;
  /**
   * Apple Pay only
   */
  nameFormatted?: string;
  /**
   * Apple Pay only
   */
  phoneNumber?: string;
  /**
   * Apple Pay only
   */
  nickname?: string;
  /**
   * Apple Pay only
   */
  street?: string;
  /**
   * Apple Pay only
   */
  city?: string;
  /**
   * Apple Pay only
   */
  state?: string;
  /**
   * Apple Pay only
   */
  postalCode?: string;
  /**
   * Apple Pay only
   */
  country?: string;
  /**
   * Apple Pay only
   */
  isoCountryCode?: string;
  /**
   * Apple Pay only
   */
  subAdministrativeArea?: string;
  /**
   * Apple Pay only
   */
  subLocality?: string;
}
