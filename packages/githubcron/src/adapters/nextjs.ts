/**
 * Next.js adapters for both App Router and Pages Router
 */

import type { ServerlessCron } from "../ServerlessCron";
import type { CronRequest } from "../types";

/**
 * Next.js App Router adapter
 * Use in app/api/cron/[job]/route.ts
 *
 * @example
 * ```typescript
 * // app/api/cron/[job]/route.ts
 * import { cron } from '@/lib/cron';
 *
 * export const POST = cron.nextjs.appRouter();
 * ```
 */
export function createAppRouterHandler(cronInstance: ServerlessCron) {
  return async function handler(
    request: Request,
    context: { params: Promise<{ job: string }> | { job: string } }
  ) {
    // Next.js 15+ uses Promise for params
    const params = await Promise.resolve(context.params);
    const jobName = params.job;
    const headers: Record<string, string> = {};

    // Extract headers
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

    const response = await cronInstance.handleRequest(cronRequest);

    return Response.json(response.body, {
      status: response.status,
      headers: response.headers,
    });
  };
}

/**
 * Next.js Pages Router adapter
 * Use in pages/api/cron/[job].ts
 *
 * @example
 * ```typescript
 * // pages/api/cron/[job].ts
 * import { cron } from '@/lib/cron';
 *
 * export default cron.nextjs.pagesRouter();
 * ```
 */
export function createPagesRouterHandler(cronInstance: ServerlessCron) {
  return async function handler(
    req: any, // NextApiRequest
    res: any // NextApiResponse
  ) {
    const jobName = Array.isArray(req.query.job)
      ? req.query.job[0]
      : req.query.job;

    if (!jobName) {
      return res.status(400).json({
        success: false,
        error: "Job name is required",
      });
    }

    const cronRequest: CronRequest = {
      jobName,
      headers: req.headers,
      body: req.body,
    };

    const response = await cronInstance.handleRequest(cronRequest);

    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    return res.status(response.status).json(response.body);
  };
}

/**
 * Next.js adapter bundle
 * Provides both App Router and Pages Router adapters
 */
export class NextjsAdapter {
  constructor(private cronInstance: ServerlessCron) {}

  /**
   * Get App Router handler
   */
  appRouter() {
    return createAppRouterHandler(this.cronInstance);
  }

  /**
   * Get Pages Router handler
   */
  pagesRouter() {
    return createPagesRouterHandler(this.cronInstance);
  }
}
