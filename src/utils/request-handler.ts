import { Context } from "hono";
import {
  createSuccessResponse,
  createErrorResponse,
  corsHeaders,
} from "./response-utils";

/**
 * Wraps a request handler function with standardized error handling
 */
export async function handleRequest<T>(
  c: Context,
  handler: () => Promise<T>,
  options: {
    path?: string;
    method?: string;
  } = {}
): Promise<Response> {
  try {
    // Handle OPTIONS requests for CORS preflight
    if (c.req.method === "OPTIONS") {
      return new Response("", {
        status: 200,
        headers: corsHeaders(c.req.header("Origin")),
      });
    }

    const result = await handler();
    return createSuccessResponse(c, result);
  } catch (error) {
    // Return appropriate error response
    return createErrorResponse(c, error);
  }
}
