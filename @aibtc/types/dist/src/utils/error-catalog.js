/**
 * Standardized error codes used throughout the application
 */
export var ErrorCode;
(function (ErrorCode) {
    // General errors (matching the existing platform)
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    // Contract-specific errors
    ErrorCode["CONTRACT_NOT_FOUND"] = "CONTRACT_NOT_FOUND";
    ErrorCode["INVALID_CONTRACT_TYPE"] = "INVALID_CONTRACT_TYPE";
    ErrorCode["INVALID_CONTRACT_SUBTYPE"] = "INVALID_CONTRACT_SUBTYPE";
    ErrorCode["TEMPLATE_PROCESSING_ERROR"] = "TEMPLATE_PROCESSING_ERROR";
    ErrorCode["TEMPLATE_NOT_FOUND"] = "TEMPLATE_NOT_FOUND";
    ErrorCode["INVALID_REPLACEMENTS"] = "INVALID_REPLACEMENTS";
})(ErrorCode || (ErrorCode = {}));
/**
 * Error message templates for each error code
 * Use {placeholders} for dynamic content
 */
export const ErrorMessages = {
    [ErrorCode.INTERNAL_ERROR]: "An internal error occurred",
    [ErrorCode.NOT_FOUND]: "Resource not found: {resource}",
    [ErrorCode.INVALID_REQUEST]: "Invalid request: {reason}",
    [ErrorCode.UNAUTHORIZED]: "Unauthorized access",
    [ErrorCode.CONTRACT_NOT_FOUND]: "Contract not found: {name}",
    [ErrorCode.INVALID_CONTRACT_TYPE]: "Invalid contract type: {type}",
    [ErrorCode.INVALID_CONTRACT_SUBTYPE]: "Invalid contract subtype: {subtype} for type: {type}",
    [ErrorCode.TEMPLATE_PROCESSING_ERROR]: "Error processing template: {reason}",
    [ErrorCode.TEMPLATE_NOT_FOUND]: "Template not found for contract: {name}",
    [ErrorCode.INVALID_REPLACEMENTS]: "Invalid replacements provided: {reason}",
};
/**
 * HTTP status codes associated with each error code
 */
export const ErrorStatusCodes = {
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.INVALID_REQUEST]: 400,
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.CONTRACT_NOT_FOUND]: 404,
    [ErrorCode.INVALID_CONTRACT_TYPE]: 400,
    [ErrorCode.INVALID_CONTRACT_SUBTYPE]: 400,
    [ErrorCode.TEMPLATE_PROCESSING_ERROR]: 500,
    [ErrorCode.TEMPLATE_NOT_FOUND]: 404,
    [ErrorCode.INVALID_REPLACEMENTS]: 400,
};
