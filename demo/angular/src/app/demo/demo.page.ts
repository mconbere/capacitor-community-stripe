import {Component, OnInit} from '@angular/core';
import {
  ApplePayEventsEnum,
  GooglePayEventsEnum,
  PaymentFlowEventsEnum,
  PaymentSheetEventsEnum,
  Stripe
} from '@capacitor-community/stripe';

import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {IonicModule} from '@ionic/angular';
import {firstValueFrom} from 'rxjs';
import { PluginListenerHandle } from '@capacitor/core';

@Component({
    selector: 'app-demo',
    templateUrl: 'demo.page.html',
    styleUrls: ['demo.page.scss'],
    standalone: true,
    imports: [IonicModule]
})
export class DemoPage implements OnInit {
  processSheet: 'willReady' | 'Ready' = 'willReady';
  processFlow: 'willReady' | 'Ready' | 'canConfirm' = 'willReady';
  processApplePay: 'willReady' | 'Ready' = 'willReady';
  processGooglePay: 'willReady' | 'Ready' = 'willReady';
  isApplePayAvailable = false;
  isGooglePayAvailable = false;
  paymentSheetConfirmListener: PluginListenerHandle;

  constructor(
    private http: HttpClient,
  ) {
  }

  async ngOnInit() {
    Stripe.addListener(PaymentSheetEventsEnum.Loaded, () => {
      this.processSheet = 'Ready';
      console.log('PaymentSheetEventsEnum.Loaded');
    });

    Stripe.addListener(PaymentSheetEventsEnum.FailedToLoad, () => {
      console.log('PaymentSheetEventsEnum.FailedToLoad');
    });

    Stripe.addListener(PaymentSheetEventsEnum.ConfirmOnServer, () => {
      console.log('PaymentSheetEventsEnum.ConfirmOnServer')
    });

    Stripe.addListener(PaymentSheetEventsEnum.Completed, () => {
      this.processSheet = 'willReady';
      console.log('PaymentSheetEventsEnum.Completed');
    });

    Stripe.addListener(PaymentSheetEventsEnum.Canceled, () => {
      this.processSheet = 'willReady';
      console.log('PaymentSheetEventsEnum.Canceled');
    });

    Stripe.addListener(PaymentSheetEventsEnum.Failed, () => {
      this.processSheet = 'willReady';
      console.log('PaymentSheetEventsEnum.Failed');
    });

    /** ------------------------------------------------------------------- **/

    Stripe.addListener(PaymentFlowEventsEnum.Loaded, () => {
      this.processFlow = 'Ready';
      console.log('PaymentFlowEventsEnum.Loaded');
    });

    Stripe.addListener(PaymentFlowEventsEnum.FailedToLoad, () => {
      console.log('PaymentFlowEventsEnum.FailedToLoad');
    });

    Stripe.addListener(PaymentFlowEventsEnum.Completed, () => {
      this.processFlow = 'willReady';
      console.log('PaymentFlowEventsEnum.Completed');
    });

    Stripe.addListener(PaymentFlowEventsEnum.Canceled, () => {
      this.processFlow = 'willReady';
      console.log('PaymentFlowEventsEnum.Canceled');
    });

    Stripe.addListener(PaymentFlowEventsEnum.Failed, () => {
      this.processFlow = 'willReady';
      console.log('PaymentFlowEventsEnum.Failed');
    });

    Stripe.addListener(PaymentFlowEventsEnum.Created, (info) => {
      console.log(info);
      this.processFlow = 'canConfirm';
    });

    /** ------------------------------------------------------------------- **/

    Stripe.addListener(ApplePayEventsEnum.Loaded, () => {
      this.processApplePay = 'Ready';
      console.log('ApplePayEventsEnum.Loaded');
    });

    Stripe.addListener(ApplePayEventsEnum.FailedToLoad, () => {
      console.log('ApplePayEventsEnum.FailedToLoad');
    });

    Stripe.addListener(ApplePayEventsEnum.Completed, () => {
      this.processApplePay = 'willReady';
      console.log('ApplePayEventsEnum.Completed');
    });

    Stripe.addListener(ApplePayEventsEnum.Canceled, () => {
      this.processApplePay = 'willReady';
      console.log('ApplePayEventsEnum.Canceled');
    });

    Stripe.addListener(ApplePayEventsEnum.Failed, () => {
      this.processApplePay = 'willReady';
      console.log('ApplePayEventsEnum.Failed');
    });

    Stripe.addListener(ApplePayEventsEnum.DidCreatePaymentMethod, (data) => {
      console.log(['ApplePayEventsEnum.DidCreatePaymentMethod', data.hasOwnProperty('contact')]);
    });

    Stripe.addListener(ApplePayEventsEnum.DidSelectShippingContact, (data) => {
      console.log(['ApplePayEventsEnum.DidSelectShippingContact', data.hasOwnProperty('contact')]);
    });

    /** ------------------------------------------------------------------- **/

    Stripe.addListener(GooglePayEventsEnum.Loaded, () => {
      this.processGooglePay = 'Ready';
      console.log('GooglePayEventsEnum.Loaded');
    });

    Stripe.addListener(GooglePayEventsEnum.FailedToLoad, () => {
      console.log('GooglePayEventsEnum.FailedToLoad');
    });

    Stripe.addListener(GooglePayEventsEnum.Completed, () => {
      this.processGooglePay = 'willReady';
      console.log('GooglePayEventsEnum.Completed');
    });

    Stripe.addListener(GooglePayEventsEnum.Canceled, () => {
      this.processGooglePay = 'willReady';
      console.log('GooglePayEventsEnum.Canceled');
    });

    Stripe.addListener(GooglePayEventsEnum.Failed, () => {
      this.processGooglePay = 'willReady';
      console.log('GooglePayEventsEnum.Failed');
    });

    Stripe.isApplePayAvailable().then(() => this.isApplePayAvailable = true).catch(() => undefined);
    Stripe.isGooglePayAvailable().then(() => this.isGooglePayAvailable = true).catch(() => undefined);
  }

  async createPaymentSheet(withCustomer = true) {
    if (withCustomer) {
      const { paymentIntent, ephemeralKey, customer } = await firstValueFrom(this.http.post<{
        paymentIntent: string;
        ephemeralKey: string;
        customer: string;
      }>(environment.api + 'intent', {}));

      await Stripe.createPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        merchantDisplayName: 'rdlabo',
      });
    } else {
      const { paymentIntent } = await firstValueFrom(this.http.post<{
        paymentIntent: string;
      }>(environment.api + 'intent/without-customer', {}));

      await Stripe.createPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        merchantDisplayName: 'rdlabo',
      });
    }
  }

  async createPaymentSheetWithSetupIntent() {
    const { setupIntent, ephemeralKey, customer } = await firstValueFrom(this.http.post<{
      setupIntent: string;
      ephemeralKey: string;
      customer: string;
    }>(environment.api + 'intent/setup', {}));

    await Stripe.createPaymentSheet({
      setupIntentClientSecret: setupIntent,
      customerEphemeralKeySecret: ephemeralKey,
      customerId: customer,
      merchantDisplayName: 'rdlabo',
      enableGooglePay: true,
      GooglePayIsTesting: true,
    });
  }

  async createPaymentSheetWithConfirmOnServer(withCustomer = true) {
    const { paymentIntentId, ephemeralKey, customer } = withCustomer ?
      await firstValueFrom(this.http.post<{
        paymentIntentId: string;
        paymentIntent: string;
        ephemeralKey: string;
        customer: string;
      }>(environment.api + 'intent', {})) :
      await firstValueFrom(this.http.post<{
        paymentIntentId: string;
        paymentIntent: string,
        ephemeralKey: undefined,
        customer: undefined,
      }>(environment.api + 'intent/without-customer', {}));

    await Stripe.createPaymentSheet({
      confirmOnServer: true,
      customerEphemeralKeySecret: ephemeralKey,
      customerId: customer,
      merchantDisplayName: 'rdlabo',
      amount: 1199,
      currency: 'usd',
    });

    if (this.paymentSheetConfirmListener) {
      this.paymentSheetConfirmListener.remove()
    }
    this.paymentSheetConfirmListener = Stripe.addListener(PaymentSheetEventsEnum.ConfirmOnServer, async ({ paymentMethod, shouldSavePaymentMethod }) => {
      try {
        const { clientSecret, error } = await firstValueFrom(this.http.post<{
          clientSecret?: string;
          error?: string;
        }>(environment.api + 'intent/confirm', {
          paymentIntentId: paymentIntentId,
          stripeId: paymentMethod.id,
          shouldSavePaymentMethod: shouldSavePaymentMethod,
        }));

        if (error) {
          throw Error(error)
        }

        await Stripe.completeConfirmPaymentSheet({ clientSecret: clientSecret });
      } catch (ex) {
        await Stripe.completeConfirmPaymentSheet({ error: ex.message });
      }
    });
  }

  presentPaymentSheet() {
    return Stripe.presentPaymentSheet();
  }

  async createPaymentFlow(withCustomer = true) {
    if (withCustomer) {
      const { paymentIntent, ephemeralKey, customer } = await firstValueFrom(this.http.post<{
        paymentIntent: string;
        ephemeralKey: string;
        customer: string;
      }>(environment.api + 'intent', {}));

      await Stripe.createPaymentFlow({
        paymentIntentClientSecret: paymentIntent,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        merchantDisplayName: 'rdlabo',
      });
    } else {
      const { paymentIntent } = await firstValueFrom(this.http.post<{
        paymentIntent: string;
      }>(environment.api + 'intent/without-customer', {}));

      await Stripe.createPaymentFlow({
        paymentIntentClientSecret: paymentIntent,
        merchantDisplayName: 'rdlabo',
      });
    }
  }

  presentPaymentFlow() {
    return Stripe.presentPaymentFlow();
  }

  confirmPaymentFlow() {
    return Stripe.confirmPaymentFlow();
  }

  async createApplePay() {
    const { paymentIntent } = await firstValueFrom(this.http.post<{
      paymentIntent: string;
    }>(environment.api + 'intent', {}));

    await Stripe.createApplePay({
      paymentIntentClientSecret: paymentIntent,
      paymentSummaryItems: [{
        label: 'Product Name',
        amount: 1099.00
      }],
      merchantIdentifier: 'merchant.com.getcapacitor.stripe',
      requiredShippingContactFields: ['postalAddress', 'phoneNumber', 'emailAddress', 'name'],
      countryCode: 'US',
      currency: 'USD',
    });
  }

  presentApplePay() {
    return Stripe.presentApplePay();
  }

  async createGooglePay() {
    const { paymentIntent } = await firstValueFrom(this.http.post<{
      paymentIntent: string;
    }>(environment.api + 'intent', {}));

    await Stripe.createGooglePay({
      paymentIntentClientSecret: paymentIntent,
      paymentSummaryItems: [{
        label: 'Product Name',
        amount: 1099.00
      }],
      merchantIdentifier: 'merchant.com.getcapacitor.stripe',
      countryCode: 'US',
      currency: 'USD',
    });
  }

  async presentGooglePay() {
    return Stripe.presentGooglePay();
  }
}
