/**
 * Express adapter
 */

import type { ServerlessCron } from "../ServerlessCron";
import type { CronRequest } from "../types";

/**
 * Express middleware adapter
 * Use with Express router
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { cron } from './cron';
 *
 * const app = express();
 * app.use(express.json());
 *
 * app.post('/api/cron/:job', cron.express());
 * ```
 */
export function createExpressHandler(cronInstance: ServerlessCron) {
  return async function handler(
    req: any, // Express Request
    res: any // Express Response
  ) {
    const jobName = req.params.job;

    if (!jobName) {
      return res.status(400).json({
        success: false,
        error: "Job name is required in route parameter",
      });
    }

    const cronRequest: CronRequest = {
      jobName,
      headers: req.headers,
      body: req.body,
    };

    try {
      const response = await cronInstance.handleRequest(cronRequest);

      if (response.headers) {
        Object.entries(response.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      return res.status(response.status).json(response.body);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Express adapter class
 */
export class ExpressAdapter {
  constructor(private cronInstance: ServerlessCron) {}

  /**
   * Get Express middleware handler
   */
  handler() {
    return createExpressHandler(this.cronInstance);
  }
}
