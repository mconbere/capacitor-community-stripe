public enum PaymentSheetEvents: String {
    case Loaded = "paymentSheetLoaded"
    case FailedToLoad = "paymentSheetFailedToLoad"
    case ConfirmOnServer = "paymentSheetConfirmOnServer"
    case Completed = "paymentSheetCompleted"
    case Canceled = "paymentSheetCanceled"
    case Failed = "paymentSheetFailed"
}
