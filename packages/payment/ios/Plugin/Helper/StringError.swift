import Foundation

struct StringError: Error, LocalizedError {
    let message: String

    var errorDescription: String? { message }
}
