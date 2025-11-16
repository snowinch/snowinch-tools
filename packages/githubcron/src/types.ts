/**
 * Type definitions for @snowinch/githubcron
 */

/**
 * Context provided to job handlers and lifecycle callbacks
 */
export interface JobContext {
  /** Name of the job being executed */
  jobName: string;
  /** Timestamp when the job started */
  startedAt: Date;
  /** Duration of the job execution in milliseconds (only available in onJobComplete/onJobError) */
  duration?: number;
  /** Result returned by the job handler (only available in onJobComplete) */
  result?: any;
  /** Error that occurred during job execution (only available in onJobError) */
  error?: Error;
  /** Request headers from the webhook call */
  headers: Record<string, string>;
  /** Any additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Job handler function signature
 */
export type JobHandler = (
  context: Omit<JobContext, "duration" | "result" | "error">,
) => Promise<any> | any;

/**
 * Lifecycle callback for job start
 */
export type OnJobStartCallback = (context: JobContext) => Promise<void> | void;

/**
 * Lifecycle callback for job completion
 */
export type OnJobCompleteCallback = (
  context: JobContext,
) => Promise<void> | void;

/**
 * Lifecycle callback for job error
 */
export type OnJobErrorCallback = (context: JobContext) => Promise<void> | void;

/**
 * Job definition
 */
export interface JobDefinition {
  /** Cron schedule expression (e.g., '0 9 * * *') */
  schedule: string | string[];
  /** Job handler function */
  handler: JobHandler;
  /** Optional job description */
  description?: string;
  /** Optional timeout in seconds (GitHub Actions timeout) */
  timeout?: number;
  /** Enable/disable retry on failure */
  retry?: boolean;
  /** Number of retry attempts */
  retryAttempts?: number;
}

/**
 * Configuration options for ServerlessCron
 */
export interface ServerlessCronOptions {
  /**
   * Workflow name - Used for GitHub Actions workflow name and filename
   * If not specified, defaults to "cron-jobs"
   * Example: "email-cron" generates "email-cron.yml"
   */
  name?: string;
  /**
   * Secret token for validating webhook requests
   * Required for handling requests, optional for generating workflows
   */
  secret?: string;
  /** Base URL of the application (used for generating GitHub workflows and local dev) */
  baseUrl?: string;
  /**
   * Name of the environment variable containing the base URL
   * If provided, GitHub Actions will use ${{ vars.ENV_VAR_NAME }} or ${{ secrets.ENV_VAR_NAME }}
   * Example: "APP_URL", "NEXT_PUBLIC_APP_URL", "VERCEL_URL"
   */
  baseUrlEnvVar?: string;
  /**
   * Whether to use GitHub vars or secrets for baseUrlEnvVar
   * - "vars": Uses ${{ vars.ENV_VAR_NAME }} (recommended for URLs)
   * - "secrets": Uses ${{ secrets.ENV_VAR_NAME }}
   * Default: "vars"
   */
  envVarSource?: "vars" | "secrets";
  /** Path prefix for cron endpoints (default: '/api/cron') */
  cronPath?: string;
  /** Callback executed when a job starts */
  onJobStart?: OnJobStartCallback;
  /** Callback executed when a job completes successfully */
  onJobComplete?: OnJobCompleteCallback;
  /** Callback executed when a job fails */
  onJobError?: OnJobErrorCallback;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom logger function */
  logger?: (
    message: string,
    level: "info" | "warn" | "error" | "debug",
  ) => void;
}

/**
 * HTTP request interface (framework-agnostic)
 */
export interface CronRequest {
  /** Job name extracted from the route */
  jobName: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body (if any) */
  body?: any;
}

/**
 * HTTP response interface (framework-agnostic)
 */
export interface CronResponse {
  /** HTTP status code */
  status: number;
  /** Response body */
  body: {
    success: boolean;
    message?: string;
    result?: any;
    error?: string;
  };
  /** Response headers */
  headers?: Record<string, string>;
}

/**
 * GitHub workflow configuration
 */
export interface WorkflowConfig {
  /** Workflow name */
  name?: string;
  /** GitHub Actions runner (default: 'ubuntu-latest') */
  runner?: string;
  /** Additional environment variables */
  env?: Record<string, string>;
}

/**
 * Error thrown by ServerlessCron
 */
export class ServerlessCronError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "ServerlessCronError";
  }
}
