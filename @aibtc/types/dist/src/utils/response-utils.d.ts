import { Context } from "hono";
/**
 * Creates CORS headers for cross-origin requests
 *
 * @param origin - Optional origin to allow, defaults to '*' (all origins)
 * @returns HeadersInit object with CORS headers
 */
export declare function corsHeaders(origin?: string): HeadersInit;
/**
 * Standard response format for all API responses
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        id: string;
        code: string;
        message: string;
        details?: Record<string, any>;
    };
}
/**
 * Creates a standardized success response
 */
export declare function createSuccessResponse<T>(c: Context, data: T, status?: number): Response;
/**
 * Creates a standardized error response
 */
export declare function createErrorResponse(c: Context, error: unknown): Response;
