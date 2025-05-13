import { Context } from "hono";
import { ApiError } from "./api-error";
import { UnofficialStatusCode } from "hono/utils/http-status";

/**
 * Creates CORS headers for cross-origin requests
 *
 * @param origin - Optional origin to allow, defaults to '*' (all origins)
 * @returns HeadersInit object with CORS headers
 */
export function corsHeaders(origin?: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Standard response format for all API responses
 */
interface ApiResponse<T> {
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
export function createSuccessResponse<T>(
  c: Context,
  data: T,
  status = 200
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };

  return c.json(body, status as UnofficialStatusCode, {
    ...corsHeaders(),
    "Content-Type": "application/json",
  });
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(c: Context, error: unknown): Response {
  let body: ApiResponse<never>;
  let status = 500;

  if (error instanceof ApiError) {
    body = {
      success: false,
      error: {
        id: error.id,
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
    status = error.status;
  } else {
    // Generate an error ID for non-ApiError errors
    const errorId = generateErrorId();
    const errorMessage = error instanceof Error ? error.message : String(error);
    body = {
      success: false,
      error: {
        id: errorId,
        code: "INTERNAL_ERROR",
        message: errorMessage || "An unexpected error occurred",
      },
    };
  }

  return c.json(body, status as UnofficialStatusCode, {
    ...corsHeaders(),
    "Content-Type": "application/json",
  });
}

/**
 * Generates a unique error ID for tracking purposes
 */
function generateErrorId(): string {
  // Use crypto.randomUUID() if available
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().split("-")[0]; // Use first segment for brevity
  }

  // Fallback to timestamp + random string
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
}
