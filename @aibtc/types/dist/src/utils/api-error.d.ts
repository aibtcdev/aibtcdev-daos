import { ErrorCode } from "./error-catalog";
/**
 * Standard API error class used throughout the application
 */
export declare class ApiError extends Error {
    code: ErrorCode;
    status: number;
    details?: Record<string, any>;
    id: string;
    /**
     * Create a new API error
     *
     * @param code - Error code from the ErrorCode enum
     * @param details - Optional details to include in the error message
     * @param id - Optional error ID (generated if not provided)
     */
    constructor(code: ErrorCode, details?: Record<string, any>, id?: string);
    /**
     * Generates a unique error ID
     */
    private generateId;
}
