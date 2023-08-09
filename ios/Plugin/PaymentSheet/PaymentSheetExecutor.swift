import Foundation
import Capacitor
import StripePaymentSheet

class PaymentSheetExecutor: NSObject {
    weak var plugin: StripePlugin?
    var paymentSheet: PaymentSheet?
    var confirmCall: CAPPluginCall?
    var continueConfirmHandler: CheckedContinuation<String, Error>?

    func createPaymentSheet(_ call: CAPPluginCall) {
        let paymentIntentClientSecret = call.getString("paymentIntentClientSecret") ?? nil
        let setupIntentClientSecret = call.getString("setupIntentClientSecret") ?? nil

        let customerId = call.getString("customerId") ?? nil
        let customerEphemeralKeySecret = call.getString("customerEphemeralKeySecret") ?? nil

        if paymentIntentClientSecret == nil && setupIntentClientSecret == nil {
            let errorText = "Invalid Params. this method require paymentIntentClientSecret or setupIntentClientSecret."
            self.plugin?.notifyListeners(PaymentSheetEvents.FailedToLoad.rawValue, data: ["error": errorText])
            call.reject(errorText)
            return
        }

        if customerId != nil && customerEphemeralKeySecret == nil {
            let errorText = "Invalid Params. When you set customerId, you must set customerEphemeralKeySecret."
            self.plugin?.notifyListeners(PaymentSheetEvents.FailedToLoad.rawValue, data: ["error": errorText])
            call.reject(errorText)
            return
        }

        // MARK: Create a PaymentSheet instance
        var configuration = PaymentSheet.Configuration()

        let merchantDisplayName = call.getString("merchantDisplayName") ?? ""
        if merchantDisplayName != "" {
            configuration.merchantDisplayName = merchantDisplayName
        }

        let returnURL = call.getString("returnURL") ?? ""
        if returnURL != "" {
            configuration.returnURL = returnURL
        }

        if #available(iOS 13.0, *) {
            let style = call.getString("style") ?? ""
            if style == "alwaysLight" {
                configuration.style = .alwaysLight
            } else if style == "alwaysDark" {
                configuration.style = .alwaysDark
            }
        }

        let applePayMerchantId = call.getString("applePayMerchantId") ?? ""

        if call.getBool("enableApplePay", false) && applePayMerchantId != "" {
            configuration.applePay = .init(
                merchantId: applePayMerchantId,
                merchantCountryCode: call.getString("countryCode", "US")
            )
        }

        if customerId != nil && customerEphemeralKeySecret != nil {
            configuration.customer = .init(id: customerId!, ephemeralKeySecret: customerEphemeralKeySecret!)
        }

        let finalizeOnServer = call.getBool("finalizeOnServer") ?? false

        if finalizeOnServer {
            if setupIntentClientSecret != nil {
                let intentConfiguration = PaymentSheet.IntentConfiguration(
                    mode: .setup(currency: call.getString("currency"), setupFutureUsage: .offSession),
                    confirmHandler: self.confirmHandler)
                self.paymentSheet = PaymentSheet(intentConfiguration: intentConfiguration, configuration: configuration)
            } else {
                guard let amount = call.getInt("amount") else {
                    call.reject("Invalid Params. When finalizeOnServer with payment intent is used amount must be set.")
                    return
                }
                guard let currency = call.getString("currency") else {
                    call.reject("Invalid Params. When finalizeOnServer with payment intent is used currency must be set.")
                    return
                }
                let intentConfiguration = PaymentSheet.IntentConfiguration(
                    mode: .payment(amount: amount, currency: currency),
                    confirmHandler: self.confirmHandler)
                self.paymentSheet = PaymentSheet(intentConfiguration: intentConfiguration, configuration: configuration)
            }
        } else {
            if setupIntentClientSecret != nil {
                self.paymentSheet = PaymentSheet(setupIntentClientSecret: setupIntentClientSecret!, configuration: configuration)
            } else {
                self.paymentSheet = PaymentSheet(paymentIntentClientSecret: paymentIntentClientSecret!, configuration: configuration)
            }
        }

        self.plugin?.notifyListeners(PaymentSheetEvents.Loaded.rawValue, data: [:])
        call.resolve([:])
    }

    func presentPaymentSheet(_ call: CAPPluginCall) {
        Task { @MainActor in
            if let rootViewController = self.plugin?.getRootVC() {
                self.paymentSheet?.present(from: rootViewController) { paymentResult in
                    // MARK: Handle the payment result
                    switch paymentResult {
                    case .completed:
                        self.plugin?.notifyListeners(PaymentSheetEvents.Completed.rawValue, data: [:])
                        call.resolve(["paymentResult": PaymentSheetEvents.Completed.rawValue])
                    case .canceled:
                        self.plugin?.notifyListeners(PaymentSheetEvents.Canceled.rawValue, data: [:])
                        call.resolve(["paymentResult": PaymentSheetEvents.Canceled.rawValue])
                    case .failed(let error):
                        self.plugin?.notifyListeners(PaymentSheetEvents.Failed.rawValue, data: ["error": error.localizedDescription])
                        call.resolve(["paymentResult": PaymentSheetEvents.Failed.rawValue])
                    }
                }
            }
        }
    }

    func finalizePaymentSheet(_ call: CAPPluginCall) {
        call.keepAlive = true
        self.plugin?.bridge?.saveCall(call)
        if let confirmCall = self.confirmCall {
            self.plugin?.bridge?.releaseCall(confirmCall)
        }
        self.confirmCall = call
    }

    func completeFinalizePaymentSheet(_ call: CAPPluginCall) {
        guard let continueConfirmHandler = continueConfirmHandler else {
            call.reject("Invalid state. Must be called inside the finalizePaymentSheet callback.")
            return
        }

        if let error = call.getString("error") {
            continueConfirmHandler.resume(throwing: NSError(domain: "capacitor-community/stripe", code: 0, userInfo: ["error": error]))
            call.resolve()
            return
        }

        guard let clientSecret = call.getString("clientSecret") else {
            continueConfirmHandler.resume(throwing: NSError(domain: "capacitor-community/stripe", code: 0, userInfo: ["error": "missing clientSecret"]))
            call.reject("Invalid Param. Missing clientSecret or error.")
            return
        }

        continueConfirmHandler.resume(returning: clientSecret)
        call.resolve()
    }

    private func confirmHandler(
        _ paymentMethod: STPPaymentMethod,
        _ shouldSavePaymentMethod: Bool,
        _ intentCreationCallback: @escaping ((Result<String, Error>) -> Void)
    ) -> Void {
        Task {
            do {
                let result = try await withCheckedThrowingContinuation { continuation in
                    self.continueConfirmHandler = continuation
                    self.confirmCall?.resolve([
                        "paymentMethod": [
                            "id": paymentMethod.stripeId,
                        ],
                        "shouldSavePaymentMethod": shouldSavePaymentMethod,
                    ])
                }
                intentCreationCallback(.success(result))
            } catch {
                intentCreationCallback(.failure(error))
            }
        }
    }
}
