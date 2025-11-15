/**
 * Standard Fetch API adapter
 * Compatible with: Cloudflare Workers, Deno Deploy, Bun, and any platform supporting Fetch API
 */

import type { ServerlessCron } from "../ServerlessCron";
import type { CronRequest } from "../types";

/**
 * Extract job name from URL pathname
 * Supports patterns like: /api/cron/job-name, /cron/job-name
 *
 * @param pathname - URL pathname
 * @param cronPath - Base cron path (e.g., '/api/cron')
 * @returns Job name or null
 */
function extractJobNameFromPath(
  pathname: string,
  cronPath: string
): string | null {
  // Remove trailing slash from cronPath
  const normalizedCronPath = cronPath.replace(/\/$/, "");

  // Check if pathname starts with cronPath
  if (!pathname.startsWith(normalizedCronPath)) {
    return null;
  }

  // Extract job name (everything after cronPath)
  const jobName = pathname.slice(normalizedCronPath.length).replace(/^\//, "");

  return jobName || null;
}

/**
 * Fetch API handler
 * Use with Cloudflare Workers, Deno Deploy, Bun, etc.
 *
 * @example
 * ```typescript
 * // Cloudflare Workers
 * import { cron } from './cron';
 *
 * export default {
 *   fetch: cron.fetch()
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Deno Deploy
 * import { cron } from './cron.ts';
 *
 * Deno.serve(cron.fetch());
 * ```
 */
export function createFetchHandler(
  cronInstance: ServerlessCron,
  cronPath?: string
) {
  const basePath = cronPath || "/api/cron";

  return async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const jobName = extractJobNameFromPath(url.pathname, basePath);

    if (!jobName) {
      return Response.json(
        {
          success: false,
          error: `Invalid path. Expected format: ${basePath}/:jobName`,
        },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const cronRequest: CronRequest = {
      jobName,
      headers,
      body,
    };

    try {
      const response = await cronInstance.handleRequest(cronRequest);

      return Response.json(response.body, {
        status: response.status,
        headers: response.headers,
      });
    } catch (error) {
      return Response.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Fetch API adapter class
 */
export class FetchAdapter {
  constructor(
    private cronInstance: ServerlessCron,
    private cronPath?: string
  ) {}

  /**
   * Get Fetch API handler
   */
  handler() {
    return createFetchHandler(this.cronInstance, this.cronPath);
  }
}
