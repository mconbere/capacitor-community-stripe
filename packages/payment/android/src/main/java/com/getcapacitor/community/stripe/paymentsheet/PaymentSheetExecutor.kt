package com.getcapacitor.community.stripe.paymentsheet

import android.app.Activity
import android.content.Context
import androidx.core.util.Supplier
import com.getcapacitor.Bridge
import com.getcapacitor.JSObject
import com.getcapacitor.Logger
import com.getcapacitor.PluginCall
import com.getcapacitor.community.stripe.models.Executor
import com.google.android.gms.common.util.BiConsumer
import com.stripe.android.model.PaymentMethod
import com.stripe.android.paymentsheet.CreateIntentResult
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class ErrorException(message: String) : Exception(message)

class PaymentSheetExecutor(
        contextSupplier: Supplier<Context?>,
        activitySupplier: Supplier<Activity?>,
        notifyListenersFunction: BiConsumer<String?, JSObject?>,
        pluginLogTag: String?
) : Executor(contextSupplier, activitySupplier, notifyListenersFunction, pluginLogTag, "PaymentSheetExecutor") {
    var paymentSheet: PaymentSheet? = null
    private val emptyObject = JSObject()
    private var confirmOnServer: Boolean = false
    private var intentConfiguration: PaymentSheet.IntentConfiguration? = null
    private var paymentConfiguration: PaymentSheet.Configuration? = null
    private var paymentIntentClientSecret: String? = null
    private var setupIntentClientSecret: String? = null

    private var continueConfirm: Continuation<String>? = null


    init {
        this.contextSupplier = contextSupplier
    }

    fun createPaymentSheet(call: PluginCall) {
        val customerId = call.getString("customerId")
        val customerEphemeralKeySecret = call.getString("customerEphemeralKeySecret")
        if (customerId != null && customerEphemeralKeySecret == null) {
            val errorText = "Invalid Params. When you set customerId, you must set customerEphemeralKeySecret."
            notifyListenersFunction.accept(PaymentSheetEvents.FailedToLoad.webEventName, JSObject().put("error", errorText))
            call.reject(errorText)
            return
        }

        val merchantDisplayName = call.getString("merchantDisplayName") ?: ""
        val enableGooglePay = call.getBoolean("enableGooglePay") ?: false
        val customer: PaymentSheet.CustomerConfiguration? = customerId?.let { cId ->
            customerEphemeralKeySecret?.let { cSecret ->
                PaymentSheet.CustomerConfiguration(cId, cSecret)
            }
        }
        if (!enableGooglePay) {
            paymentConfiguration = PaymentSheet.Configuration(merchantDisplayName, customer)
        } else {
            val googlePayEnvironment = call.getBoolean("GooglePayIsTesting") ?: false
            val environment = if (googlePayEnvironment)
                PaymentSheet.GooglePayConfiguration.Environment.Test
            else
                PaymentSheet.GooglePayConfiguration.Environment.Production

            paymentConfiguration = PaymentSheet.Configuration(
                    merchantDisplayName,
                    customer,
                    PaymentSheet.GooglePayConfiguration(
                            environment,
                            call.getString("countryCode") ?: "US"
                    )
            )
        }

        confirmOnServer = call.getBoolean("confirmOnServer") ?: false
        if (!confirmOnServer) {
            paymentIntentClientSecret = call.getString("paymentIntentClientSecret")
            setupIntentClientSecret = call.getString("setupIntentClientSecret")
            if (paymentIntentClientSecret == null && setupIntentClientSecret == null) {
                val errorText = "Invalid Params. This method require paymentIntentClientSecret or setupIntentClientSecret."
                notifyListenersFunction.accept(PaymentSheetEvents.FailedToLoad.webEventName, JSObject().put("error", errorText))
                call.reject(errorText)
                return
            }
        } else {
            val amount = call.getLong("amount") ?: call.getInt("amount")?.toLong() // Required for Mode.Payment.
            val currency = call.getString("currency") // Required.
            val setupFutureUsage = parseSetupFutureUse(call.getString("setupFutureUsage")) // Required for Mode.Setup, optional for Mode.Payment.
            val paymentMethodTypes = call.getArray("paymentMethodTypes")?.toList<String>() ?: emptyList() // Optional.
            val onBehalfOf = call.getString("onBehalfOf") // Optional.

            if (currency == null) {
                call.reject("Invalid params. If confirmOnServer is set, currency must also be set.")
                return
            }

            val mode = if (amount != null) {
                val captureMethod = parseCaptureMethod(call.getString("captureMethod")) ?: PaymentSheet.IntentConfiguration.CaptureMethod.Automatic
                PaymentSheet.IntentConfiguration.Mode.Payment(
                        amount,
                        currency,
                        setupFutureUsage,
                        captureMethod
                )
            } else if (setupFutureUsage != null) {
                PaymentSheet.IntentConfiguration.Mode.Setup(
                        currency,
                        setupFutureUsage
                )
            } else {
                call.reject("Invalid params. Either amount or setupFutureUsage must be set.")
                return
            }
            intentConfiguration = PaymentSheet.IntentConfiguration(
                    mode,
                    paymentMethodTypes,
                    onBehalfOf
            )
        }
        notifyListenersFunction.accept(PaymentSheetEvents.Loaded.webEventName, emptyObject)
        call.resolve()
    }

    private fun parseSetupFutureUse(setupFutureUsage: String?): PaymentSheet.IntentConfiguration.SetupFutureUse? {
        return when (setupFutureUsage) {
            "offSession" -> PaymentSheet.IntentConfiguration.SetupFutureUse.OffSession
            "onSession" -> PaymentSheet.IntentConfiguration.SetupFutureUse.OnSession
            else -> null
        }
    }

    private fun parseCaptureMethod(captureMethod: String?): PaymentSheet.IntentConfiguration.CaptureMethod? {
        return when (captureMethod) {
            "automatic" -> PaymentSheet.IntentConfiguration.CaptureMethod.Automatic
            "manual" -> PaymentSheet.IntentConfiguration.CaptureMethod.Manual
            "automaticAsync" -> PaymentSheet.IntentConfiguration.CaptureMethod.AutomaticAsync
            else -> null
        }
    }

    fun presentPaymentSheet(call: PluginCall) {
        try {
            if (intentConfiguration != null) {
                paymentSheet!!.presentWithIntentConfiguration(intentConfiguration!!, paymentConfiguration)
            } else {
                if (paymentIntentClientSecret != null) {
                    paymentSheet!!.presentWithPaymentIntent(paymentIntentClientSecret!!, paymentConfiguration)
                } else {
                    paymentSheet!!.presentWithSetupIntent(setupIntentClientSecret!!, paymentConfiguration)
                }
            }
        } catch (ex: Exception) {
            call.reject(ex.localizedMessage, ex)
        }
    }

    fun completeConfirmPaymentSheet(call: PluginCall) {
        try {
            val continueConfirm = continueConfirm
            if (continueConfirm == null) {
                call.reject("Invalid state. Must be called inside the finalizePaymentSheet callback.")
                return
            }

            val error = call.getString("error")
            if (error != null) {
                continueConfirm.resumeWithException(ErrorException(error))
                call.resolve()
                return
            }

            val clientSecret = call.getString("clientSecret")
            if (clientSecret == null) {
                continueConfirm.resumeWithException(ErrorException("Invalid Param. Missing clientSecret or error."))
                call.reject("Invalid Param. Missing clientSecret or error.")
            } else {
                continueConfirm.resume(clientSecret)
            }

            call.resolve()
        } catch (ex: Exception) {
            call.reject(ex.localizedMessage, ex)
        }
    }

    suspend fun onConfirm(bridge: Bridge, callbackId: String?, paymentMethod: PaymentMethod, shouldSavePaymentMethod: Boolean): CreateIntentResult {
        Logger.info("ConfirmIntentCallback called")
        return try {
            val clientSecret = suspendCoroutine { cont ->
                continueConfirm = cont
                notifyListenersFunction.accept(PaymentSheetEvents.ConfirmOnServer.webEventName, JSObject()
                        .put("paymentMethod", JSObject().put("id", paymentMethod.id))
                        .put("shouldSavePaymentMethod", shouldSavePaymentMethod)
                )
            }
            CreateIntentResult.Success(clientSecret)
        } catch (error: ErrorException) {
            CreateIntentResult.Failure(error, error.message)
        } catch (ex: Exception) {
            CreateIntentResult.Failure(ex, ex.localizedMessage)
        }    }

    fun onPaymentSheetResult(bridge: Bridge, callbackId: String?, paymentSheetResult: PaymentSheetResult) {
        val call = bridge.getSavedCall(callbackId)
        when (paymentSheetResult) {
            is PaymentSheetResult.Canceled -> {
                notifyListenersFunction.accept(PaymentSheetEvents.Canceled.webEventName, emptyObject)
                call.resolve(JSObject().put("paymentResult", PaymentSheetEvents.Canceled.webEventName))
            }

            is PaymentSheetResult.Failed -> {
                notifyListenersFunction.accept(
                        PaymentSheetEvents.Failed.webEventName,
                        JSObject().put("error", paymentSheetResult.error.localizedMessage)
                )
                notifyListenersFunction.accept(PaymentSheetEvents.Failed.webEventName, emptyObject)
                call.resolve(JSObject().put("paymentResult", PaymentSheetEvents.Failed.webEventName))
            }

            is PaymentSheetResult.Completed -> {
                notifyListenersFunction.accept(PaymentSheetEvents.Completed.webEventName, emptyObject)
                call.resolve(JSObject().put("paymentResult", PaymentSheetEvents.Completed.webEventName))
            }
        }
    }
}