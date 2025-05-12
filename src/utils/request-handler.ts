import { Context } from 'hono';
import { ApiError } from './api-error';
import { createSuccessResponse, createErrorResponse } from './response-utils';

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
    const result = await handler();
    return createSuccessResponse(c, result);
  } catch (error) {
    // Return appropriate error response
    return createErrorResponse(c, error);
  }
}
