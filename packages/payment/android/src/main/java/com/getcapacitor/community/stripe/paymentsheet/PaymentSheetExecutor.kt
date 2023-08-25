package com.getcapacitor.community.stripe.paymentsheet

import android.app.Activity
import android.content.Context
import androidx.core.util.Supplier
import com.getcapacitor.Bridge
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.getcapacitor.community.stripe.models.Executor
import com.google.android.gms.common.util.BiConsumer
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult

class PaymentSheetExecutor(
        contextSupplier: Supplier<Context?>,
        activitySupplier: Supplier<Activity?>,
        notifyListenersFunction: BiConsumer<String?, JSObject?>,
        pluginLogTag: String?
) : Executor(contextSupplier, activitySupplier, notifyListenersFunction, pluginLogTag, "PaymentSheetExecutor") {
    var paymentSheet: PaymentSheet? = null
    private val emptyObject = JSObject()
    private var paymentConfiguration: PaymentSheet.Configuration? = null
    private var paymentIntentClientSecret: String? = null
    private var setupIntentClientSecret: String? = null

    init {
        this.contextSupplier = contextSupplier
    }

    fun createPaymentSheet(call: PluginCall) {
        paymentIntentClientSecret = call.getString("paymentIntentClientSecret", null)
        setupIntentClientSecret = call.getString("setupIntentClientSecret", null)
        val customerEphemeralKeySecret = call.getString("customerEphemeralKeySecret", null)
        val customerId = call.getString("customerId", null)
        if (paymentIntentClientSecret == null && setupIntentClientSecret == null) {
            val errorText = "Invalid Params. This method require paymentIntentClientSecret or setupIntentClientSecret."
            notifyListenersFunction.accept(PaymentSheetEvents.FailedToLoad.webEventName, JSObject().put("error", errorText))
            call.reject(errorText)
            return
        }
        if (customerId != null && customerEphemeralKeySecret == null) {
            val errorText = "Invalid Params. When you set customerId, you must set customerEphemeralKeySecret."
            notifyListenersFunction.accept(PaymentSheetEvents.FailedToLoad.webEventName, JSObject().put("error", errorText))
            call.reject(errorText)
            return
        }
        var merchantDisplayName = call.getString("merchantDisplayName")
        if (merchantDisplayName == null) {
            merchantDisplayName = ""
        }
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
        notifyListenersFunction.accept(PaymentSheetEvents.Loaded.webEventName, emptyObject)
        call.resolve()
    }

    fun presentPaymentSheet(call: PluginCall) {
        try {
            if (paymentIntentClientSecret != null) {
                paymentSheet!!.presentWithPaymentIntent(paymentIntentClientSecret!!, paymentConfiguration)
            } else {
                paymentSheet!!.presentWithSetupIntent(setupIntentClientSecret!!, paymentConfiguration)
            }
        } catch (ex: Exception) {
            call.reject(ex.localizedMessage, ex)
        }
    }

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