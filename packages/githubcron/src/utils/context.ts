/**
 * Context builder utilities
 */

import type { JobContext } from "../types";

/**
 * Creates a base job context
 *
 * @param jobName - Name of the job
 * @param headers - Request headers
 * @param metadata - Additional metadata
 * @returns Job context object
 */
export function createJobContext(
  jobName: string,
  headers: Record<string, string>,
  metadata?: Record<string, any>
): Omit<JobContext, "duration" | "result" | "error"> {
  return {
    jobName,
    startedAt: new Date(),
    headers,
    metadata,
  };
}

/**
 * Adds completion data to a job context
 *
 * @param context - Base job context
 * @param result - Job result
 * @param startTime - Start time in milliseconds
 * @returns Complete job context
 */
export function completeJobContext(
  context: Omit<JobContext, "duration" | "result" | "error">,
  result: any,
  startTime: number
): JobContext {
  return {
    ...context,
    result,
    duration: Date.now() - startTime,
  };
}

/**
 * Adds error data to a job context
 *
 * @param context - Base job context
 * @param error - Error that occurred
 * @param startTime - Start time in milliseconds
 * @returns Complete job context with error
 */
export function errorJobContext(
  context: Omit<JobContext, "duration" | "result" | "error">,
  error: Error,
  startTime: number
): JobContext {
  return {
    ...context,
    error,
    duration: Date.now() - startTime,
  };
}
