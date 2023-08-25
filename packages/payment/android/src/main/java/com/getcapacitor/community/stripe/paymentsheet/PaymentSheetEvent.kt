package com.getcapacitor.community.stripe.paymentsheet;

enum class PaymentSheetEvents(val webEventName: String) {
    Loaded("paymentSheetLoaded"),
    FailedToLoad("paymentSheetFailedToLoad"),
    ConfirmOnServer(webEventName = "paymentSheetConfirmOnServer"),
    Completed("paymentSheetCompleted"),
    Canceled("paymentSheetCanceled"),
    Failed("paymentSheetFailed"),
}
