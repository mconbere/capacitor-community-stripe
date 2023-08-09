import type { PluginListenerHandle } from '@capacitor/core';

import type {
  CompleteFinalizePaymentSheetOption,
  CreatePaymentSheetOption,
  FinalizePaymentSheetCallback,
  FinalizePaymentSheetCallbackID
} from '../shared';

import type { PaymentSheetEventsEnum, PaymentSheetResultInterface } from './payment-sheet-events.enum';

export interface PaymentSheetDefinitions {
  createPaymentSheet(options: CreatePaymentSheetOption): Promise<void>;
  presentPaymentSheet(): Promise<{
    paymentResult: PaymentSheetResultInterface;
  }>;
  finalizePaymentSheet(callback: FinalizePaymentSheetCallback): Promise<FinalizePaymentSheetCallbackID>
  completeFinalizePaymentSheet(options: CompleteFinalizePaymentSheetOption): Promise<void>;

  addListener(
    eventName: PaymentSheetEventsEnum.Loaded,
    listenerFunc: () => void,
  ): PluginListenerHandle;

  addListener(
    eventName: PaymentSheetEventsEnum.FailedToLoad,
    listenerFunc: (error: string) => void,
  ): PluginListenerHandle;

  addListener(
    eventName: PaymentSheetEventsEnum.Completed,
    listenerFunc: () => void,
  ): PluginListenerHandle;

  addListener(
    eventName: PaymentSheetEventsEnum.Canceled,
    listenerFunc: () => void,
  ): PluginListenerHandle;

  addListener(
    eventName: PaymentSheetEventsEnum.Failed,
    listenerFunc: (error: string) => void,
  ): PluginListenerHandle;
}
