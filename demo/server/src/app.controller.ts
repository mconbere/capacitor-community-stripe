import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Stripe } from 'stripe';
import { ConfirmPaymentIntentDTO, CreatePaymentIntentDTO, CreateSetupIntentDTO } from './payment-intent.dto';

@Controller()
export class AppController {
  private stripe: Stripe;
  constructor(private readonly appService: AppService) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.stripe = require('stripe')('sk_test_51MmARtKzMYim9cy3l0jRblHOagmulcxNgJpXRLB3yDDyObnep8C5Eo70FrT5oDJr60G3CPAqdLVHagSyXizvk0ko00645CTaT5');
  }

  @Post('intent')
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDTO,
  ): Promise<{
    paymentIntentId: string;
    paymentIntent: string;
    ephemeralKey: string;
    customer: string;
  }> {
    /**
     * https://stripe.com/docs/payments/accept-a-payment?platform=ios
     */
    const customerId = await (async () => {
      if (createPaymentIntentDto.customer_id)
        return createPaymentIntentDto.customer_id;
      const customer = await this.stripe.customers.create();
      return customer.id;
    })();
    const ephemeralKey = await this.stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2020-08-27' },
    );
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: createPaymentIntentDto.amount || 1099,
      currency: createPaymentIntentDto.currency || 'usd',
      customer: customerId,
    });
    return {
      paymentIntentId: paymentIntent.id,
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
    };
  }

  @Post('intent/setup')
  async createSetupIntent(
    @Body() createSetupIntentDto: CreateSetupIntentDTO,
  ): Promise<{
    setupIntent: string;
    ephemeralKey: string;
    customer: string;
  }> {
    const customerId = await (async () => {
      if (createSetupIntentDto.customer_id)
        return createSetupIntentDto.customer_id;
      const customer = await this.stripe.customers.create();
      return customer.id;
    })();
    const ephemeralKey = await this.stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2020-08-27' },
    );
    const setupIntent = await this.stripe.setupIntents.create({
      customer: customerId,
      usage: 'on_session'
    });
    return {
      setupIntent: setupIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
    };
  }

  @Post('intent/without-customer')
  async createIntentWithoutCustomer(
    @Body() createPaymentIntentDto: CreatePaymentIntentDTO,
  ): Promise<{
    paymentIntentId: string;
    paymentIntent: string;
  }> {
    /**
     * https://stripe.com/docs/payments/accept-a-payment?platform=ios
     */
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: createPaymentIntentDto.amount || 1099,
      currency: createPaymentIntentDto.currency || 'usd',
    });
    return {
      paymentIntentId: paymentIntent.id,
      paymentIntent: paymentIntent.client_secret,
    };
  }

  @Post('intent/confirm')
  async confirmIntent(
    @Body() confirmPaymentIntentDto: ConfirmPaymentIntentDTO,
  ): Promise<{
    clientSecret: string;
  }> {
    /**
     * https://stripe.com/docs/payments/finalize-payments-on-the-server
     */
    const confirmedPaymentIntent = await this.stripe.paymentIntents.confirm(
      confirmPaymentIntentDto.paymentIntentId,
      {
        payment_method: confirmPaymentIntentDto.stripeId,
        setup_future_usage: confirmPaymentIntentDto.shouldSavePaymentMethod ? 'off_session' : undefined,
      }
    );
    return { clientSecret: confirmedPaymentIntent.client_secret }
  }

  @Post('identify')
  async createVerificationSessions(): Promise<{
    verficationSessionId: string;
    ephemeralKeySecret: string;
  }> {
    /**
     * https://stripe.com/docs/payments/accept-a-payment?platform=ios
     */
    const verificationSession = await this.stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: '1',
      },
    });
    const ephemeralKey = await this.stripe.ephemeralKeys.create(
      {verification_session: verificationSession.id},
      {apiVersion: '2022-11-15'}
    );
    return {
      verficationSessionId: verificationSession.id,
      ephemeralKeySecret: ephemeralKey.secret,
    };
  }

  @Post('connection/token')
  async createConnectionToken(): Promise<{
    secret: string;
  }> {
    const connectionToken = await this.stripe.terminal.connectionTokens.create();
    return {
      secret: connectionToken.secret,
    };
  }

  @Post('connection/location')
  async createConnectionLocation(): Promise<{
    locationId: string;
  }> {
    const location = await this.stripe.terminal.locations.create({
      display_name: 'Venice Burrito Shop',
      address: {
        line1: '1272 Valencia Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        postal_code: '94110',
      },
    });
    return {
      locationId: location.id,
    };
  }

  @Post('connection/intent')
  async createConnectionIntent(): Promise<{
    paymentIntent: string;
  }> {
    const intent = await this.stripe.paymentIntents.create({
      amount: 1000,
      currency: 'usd',
      payment_method_types: ['card_present'],
      capture_method: 'manual',
    });
    return {
      paymentIntent: intent.client_secret,
    };
  }
}
