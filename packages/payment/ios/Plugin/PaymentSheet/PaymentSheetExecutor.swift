import Foundation
import Capacitor
import StripePaymentSheet

class PaymentSheetExecutor: NSObject {
    weak var plugin: StripePlugin?
    var paymentSheet: PaymentSheet?
    var continueConfirmHandler: CheckedContinuation<String, Error>? = nil

    func createPaymentSheet(_ call: CAPPluginCall) {
        var configuration = PaymentSheet.Configuration()

        if let merchantDisplayName = call.getString("merchantDisplayName") {
            configuration.merchantDisplayName = merchantDisplayName
        }

        if let returnURL = call.getString("returnURL") {
            configuration.returnURL = returnURL
        }

        if let style = parse(style: call.getString("style")) {
            configuration.style = style
        }

        if let applePayMerchantId = call.getString("applePayMerchantId"), call.getBool("enableApplePay", false) {
            configuration.applePay = .init(
                merchantId: applePayMerchantId,
                merchantCountryCode: call.getString("countryCode", "US")
            )
        }

        let customerId = call.getString("customerId")
        let customerEphemeralKeySecret = call.getString("customerEphemeralKeySecret")

        if let customerId = customerId, let customerEphemeralKeySecret = customerEphemeralKeySecret {
            configuration.customer = .init(id: customerId, ephemeralKeySecret: customerEphemeralKeySecret)
        } else if customerId != nil || customerEphemeralKeySecret != nil {
            let errorText = "Invalid Params. When you set customerId, you must set customerEphemeralKeySecret."
            self.plugin?.notifyListeners(PaymentSheetEvents.FailedToLoad.rawValue, data: ["error": errorText])
            call.reject(errorText)
            return
        }

        let confirmOnServer = call.getBool("confirmOnServer") ?? false
        if !confirmOnServer {
            let paymentIntentClientSecret = call.getString("paymentIntentClientSecret")
            let setupIntentClientSecret = call.getString("setupIntentClientSecret")

            if let setupIntentClientSecret = setupIntentClientSecret {
                self.paymentSheet = PaymentSheet(
                    setupIntentClientSecret: setupIntentClientSecret,
                    configuration: configuration
                )
            } else if let paymentIntentClientSecret = paymentIntentClientSecret {
                self.paymentSheet = PaymentSheet(
                    paymentIntentClientSecret: paymentIntentClientSecret,
                    configuration: configuration
                )
            } else {
                let errorText = "Invalid Params. this method require paymentIntentClientSecret or setupIntentClientSecret."
                self.plugin?.notifyListeners(PaymentSheetEvents.FailedToLoad.rawValue, data: ["error": errorText])
                call.reject(errorText)
                return
            }
        } else {
            let amount = call.getInt("amount") // Required for mode = .payment.
            let currency = call.getString("currency") // Required.
            let setupFutureUsage = parse(setupFutureUse: call.getString("setupFutureUsage")) // Required for mode = .setup, optional for mode = .payment.
            let paymentMethodTypes = call.getArray("paymentMethodTypes", String.self) // Optional.
            let onBehalfOf = call.getString("onBehalfOf") // Optional.

            guard let currency = currency else {
                call.reject("Invalid params. If confirmOnServer is set, currency must also be set.")
                return
            }

            guard let mode = (amount.map { amount in
                let captureMethod = parse(captureMethod: call.getString("captureMethod")) ?? .automatic
                return PaymentSheet.IntentConfiguration.Mode.payment(
                    amount: amount,
                    currency: currency,
                    setupFutureUsage: setupFutureUsage,
                    captureMethod: captureMethod
                )
            } ?? setupFutureUsage.map { setupFutureUsage in
                return PaymentSheet.IntentConfiguration.Mode.setup(
                    currency: currency,
                    setupFutureUsage: setupFutureUsage
                )
            }) else {
                call.reject("Invalid params. Either amount or setupFutureUsage must be set.")
                return
            }

            let intentConfiguration = PaymentSheet.IntentConfiguration(
                mode: mode,
                paymentMethodTypes: paymentMethodTypes,
                onBehalfOf: onBehalfOf,
                confirmHandler: self.confirmHandler(_:_:_:)
            )

            self.paymentSheet = PaymentSheet(
                intentConfiguration: intentConfiguration,
                configuration: configuration
            )
        }

        self.plugin?.notifyListeners(PaymentSheetEvents.Loaded.rawValue, data: [:])
        call.resolve()
    }

    private func parse(style: String?) -> PaymentSheet.UserInterfaceStyle? {
        switch style {
        case "alwaysLight":
            return .alwaysLight
        case "alwaysDark":
            return .alwaysDark
        case "automatic":
            return .automatic
        default:
            return nil
        }
    }

    private func parse(setupFutureUse: String?) -> PaymentSheet.IntentConfiguration.SetupFutureUsage? {
        switch setupFutureUse {
        case "offSession":
            return .offSession
        case "onSession":
            return .onSession
        default:
            return nil
        }
    }

    private func parse(captureMethod: String?) -> PaymentSheet.IntentConfiguration.CaptureMethod? {
        switch captureMethod {
        case "automatic":
            return .automatic
        case "manual":
            return .manual
        case "automaticAsync":
            return .automaticAsync
        default:
            return nil
        }
    }

    func presentPaymentSheet(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
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

    func completeConfirmPaymentSheet(_ call: CAPPluginCall) {
        guard let continueConfirmHandler = continueConfirmHandler else {
            call.reject("Invalid state. Must be called inside the confirmPaymentSheet callback.")
            return
        }

        if let error = call.getString("error") {
            continueConfirmHandler.resume(throwing: StringError(message: error))
            call.resolve()
            return
        }

        guard let clientSecret = call.getString("clientSecret") else {
            continueConfirmHandler.resume(throwing: StringError(message: "Invalid Param. Missing clientSecret or error."))
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
                    self.plugin?.notifyListeners(PaymentSheetEvents.ConfirmOnServer.rawValue, data: [
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
