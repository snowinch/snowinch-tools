/**
 * @snowinch-tools/githubcron
 *
 * GitHub Actions powered cron jobs for serverless applications
 * Framework-agnostic with adapters for Next.js, Express, and Fetch API
 */

export { ServerlessCron } from "./ServerlessCron";
export { NextjsAdapter } from "./adapters/nextjs";
export { ExpressAdapter } from "./adapters/express";
export { FetchAdapter } from "./adapters/fetch";

export type {
  ServerlessCronOptions,
  JobDefinition,
  JobContext,
  JobHandler,
  OnJobStartCallback,
  OnJobCompleteCallback,
  OnJobErrorCallback,
  CronRequest,
  CronResponse,
  WorkflowConfig,
} from "./types";

export { ServerlessCronError } from "./types";
export {
  validateSecret,
  validateMethod,
  generateSecret,
} from "./utils/security";
