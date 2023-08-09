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
}

export interface CompleteFinalizePaymentSheetOption {
  /**
   * Set the client secret of the payment intent finalized on the server.
   */
  clientSecret?: string;

  /**
   * Set error to indicate there was an error confirming the payment intent while finalizing on the server.
   */
  error?: string;
}

export interface PaymentMethod {
  /**
   * Stripe identifier of the payment method.
   */
  id: string;
}

export type FinalizePaymentSheetCallback = (message: {paymentMethod: PaymentMethod; shouldSavePaymentMethod: boolean}) => void;

export type FinalizePaymentSheetCallbackID = string;

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

  /**
   * Set finalize on server.
   */
  finalizeOnServer?: boolean;

  /**
   * Set amount intended to be collected in the smallest currency unit (e.g. 100 cents to charge $1.00). Shown in Apple Pay, Buy now pay later UIs, the Pay button, and influences available payment methods.
   */
  amount?: number;

  /**
   * Set currency using three-letter ISO currency code. Filters out payment methods based on supported currency.
   */
  currency?: string;
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
   * need @stripe-elements/stripe-elements > 1.1.0
   */
  paymentSummaryItems?: {
    label: string;
    amount: number;
  }[];
  /**
   * Web only
   * need @stripe-elements/stripe-elements > 1.1.0
   */
  merchantIdentifier?: string;
  /**
   * Web only
   * need @stripe-elements/stripe-elements > 1.1.0
   */
  countryCode?: string;
  /**
   * Web only
   * need @stripe-elements/stripe-elements > 1.1.0
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
