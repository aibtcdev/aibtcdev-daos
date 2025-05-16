/**
 * Standardized error codes used throughout the application
 */
export declare enum ErrorCode {
    INTERNAL_ERROR = "INTERNAL_ERROR",
    NOT_FOUND = "NOT_FOUND",
    INVALID_REQUEST = "INVALID_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    CONTRACT_NOT_FOUND = "CONTRACT_NOT_FOUND",
    INVALID_CONTRACT_TYPE = "INVALID_CONTRACT_TYPE",
    INVALID_CONTRACT_SUBTYPE = "INVALID_CONTRACT_SUBTYPE",
    TEMPLATE_PROCESSING_ERROR = "TEMPLATE_PROCESSING_ERROR",
    TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
    INVALID_REPLACEMENTS = "INVALID_REPLACEMENTS"
}
/**
 * Error message templates for each error code
 * Use {placeholders} for dynamic content
 */
export declare const ErrorMessages: Record<ErrorCode, string>;
/**
 * HTTP status codes associated with each error code
 */
export declare const ErrorStatusCodes: Record<ErrorCode, number>;
