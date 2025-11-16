/**
 * ServerlessCron - Main class for serverless cron job orchestration
 */

import type {
  ServerlessCronOptions,
  JobDefinition,
  CronRequest,
  CronResponse,
  WorkflowConfig,
} from "./types";
import { ServerlessCronError } from "./types";
import { validateSecret, validateMethod } from "./utils/security";
import {
  createJobContext,
  completeJobContext,
  errorJobContext,
} from "./utils/context";
import { NextjsAdapter } from "./adapters/nextjs";
import { ExpressAdapter } from "./adapters/express";
import { FetchAdapter } from "./adapters/fetch";

/**
 * ServerlessCron orchestrator
 *
 * @example
 * ```typescript
 * const cron = new ServerlessCron({
 *   secret: process.env.GITHUBCRON_SECRET,
 *   baseUrl: 'https://my-app.com',
 *   onJobComplete: async (ctx) => {
 *     console.log(`Job ${ctx.jobName} completed in ${ctx.duration}ms`);
 *   }
 * });
 *
 * cron.job('daily-cleanup', {
 *   schedule: '0 0 * * *',
 *   handler: async () => {
 *     // Your cleanup logic
 *   }
 * });
 * ```
 */
export class ServerlessCron {
  private options: Required<
    Omit<
      ServerlessCronOptions,
      | "onJobStart"
      | "onJobComplete"
      | "onJobError"
      | "logger"
      | "baseUrlEnvVar"
      | "envVarSource"
      | "name"
    >
  > &
    Pick<
      ServerlessCronOptions,
      | "onJobStart"
      | "onJobComplete"
      | "onJobError"
      | "logger"
      | "baseUrlEnvVar"
      | "envVarSource"
      | "name"
    >;
  private jobs: Map<string, JobDefinition> = new Map();

  // Framework adapters
  public readonly nextjs: NextjsAdapter;
  public readonly express: ExpressAdapter;
  public readonly fetch: FetchAdapter;

  constructor(options: ServerlessCronOptions) {
    this.options = {
      name: options.name,
      secret: options.secret || "",
      baseUrl: options.baseUrl || "",
      cronPath: options.cronPath || "/api/cron",
      debug: options.debug || false,
      baseUrlEnvVar: options.baseUrlEnvVar,
      envVarSource: options.envVarSource,
      onJobStart: options.onJobStart,
      onJobComplete: options.onJobComplete,
      onJobError: options.onJobError,
      logger: options.logger,
    };

    // Initialize adapters
    this.nextjs = new NextjsAdapter(this);
    this.express = new ExpressAdapter(this);
    this.fetch = new FetchAdapter(this, this.options.cronPath);
  }

  /**
   * Register a new cron job
   *
   * @param name - Unique job name
   * @param definition - Job definition with schedule and handler
   *
   * @example
   * ```typescript
   * cron.job('send-emails', {
   *   schedule: '0 9 * * *',
   *   handler: async (ctx) => {
   *     await sendDailyEmails();
   *     return { sent: 100 };
   *   }
   * });
   * ```
   */
  public job(name: string, definition: JobDefinition): void {
    if (this.jobs.has(name)) {
      throw new ServerlessCronError(
        `Job "${name}" already exists`,
        "DUPLICATE_JOB",
        500,
      );
    }

    // Validate cron expression (basic validation)
    const schedules = Array.isArray(definition.schedule)
      ? definition.schedule
      : [definition.schedule];

    for (const schedule of schedules) {
      if (!this.isValidCronExpression(schedule)) {
        throw new ServerlessCronError(
          `Invalid cron expression: ${schedule}`,
          "INVALID_CRON_EXPRESSION",
          500,
        );
      }
    }

    this.jobs.set(name, definition);
    this.log(
      `Job "${name}" registered with schedule: ${schedules.join(", ")}`,
      "info",
    );
  }

  /**
   * Get all registered jobs
   *
   * @returns Map of job name to job definition
   */
  public getJobs(): Map<string, JobDefinition> {
    return new Map(this.jobs);
  }

  /**
   * Get baseUrlEnvVar option
   */
  public getBaseUrlEnvVar(): string | undefined {
    return this.options.baseUrlEnvVar;
  }

  /**
   * Get cronPath option
   */
  public getCronPath(): string {
    return this.options.cronPath;
  }

  /**
   * Get workflow name
   */
  public getWorkflowName(): string {
    return this.options.name || "cron-jobs";
  }

  /**
   * Handle an incoming webhook request
   *
   * @param request - Framework-agnostic request object
   * @returns Response object
   */
  public async handleRequest(request: CronRequest): Promise<CronResponse> {
    // Validate secret at runtime (when actually handling requests)
    if (!this.options.secret) {
      return {
        status: 500,
        body: {
          success: false,
          error:
            "GITHUBCRON_SECRET is not configured. Set it in your ServerlessCron options.",
        },
      };
    }
    try {
      // Validate secret
      validateSecret(request.headers, this.options.secret);

      const jobName = request.jobName;

      if (!this.jobs.has(jobName)) {
        throw new ServerlessCronError(
          `Job "${jobName}" not found`,
          "JOB_NOT_FOUND",
          404,
        );
      }

      const job = this.jobs.get(jobName)!;
      const startTime = Date.now();

      // Create context
      const context = createJobContext(jobName, request.headers);

      // Execute onJobStart callback
      if (this.options.onJobStart) {
        await this.options.onJobStart(context);
      }

      this.log(`Executing job: ${jobName}`, "info");

      try {
        // Execute job handler
        const result = await job.handler(context);

        // Create complete context
        const completeContext = completeJobContext(context, result, startTime);

        // Execute onJobComplete callback
        if (this.options.onJobComplete) {
          await this.options.onJobComplete(completeContext);
        }

        this.log(
          `Job "${jobName}" completed successfully in ${completeContext.duration}ms`,
          "info",
        );

        return {
          status: 200,
          body: {
            success: true,
            message: `Job "${jobName}" executed successfully`,
            result,
          },
        };
      } catch (error) {
        // Create error context
        const errorContext = errorJobContext(
          context,
          error instanceof Error ? error : new Error(String(error)),
          startTime,
        );

        // Execute onJobError callback
        if (this.options.onJobError) {
          await this.options.onJobError(errorContext);
        }

        this.log(
          `Job "${jobName}" failed: ${errorContext.error?.message}`,
          "error",
        );

        throw error;
      }
    } catch (error) {
      if (error instanceof ServerlessCronError) {
        return {
          status: error.statusCode,
          body: {
            success: false,
            error: error.message,
          },
        };
      }

      return {
        status: 500,
        body: {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  }

  /**
   * Generate GitHub Actions workflow configuration
   *
   * @param config - Workflow configuration options
   * @returns YAML string for .github/workflows/{name}.yml
   */
  public generateGitHubWorkflow(config?: WorkflowConfig): string {
    // Check if we have either baseUrl or baseUrlEnvVar
    if (!this.options.baseUrl && !this.options.baseUrlEnvVar) {
      throw new ServerlessCronError(
        "Either baseUrl or baseUrlEnvVar is required to generate GitHub workflow",
        "MISSING_BASE_URL",
        500,
      );
    }

    const workflowName =
      this.options.name || config?.name || "Serverless Cron Jobs";
    const runner = config?.runner || "ubuntu-latest";

    // Determine base URL for workflow
    let workflowBaseUrl: string;
    if (this.options.baseUrlEnvVar) {
      const source = this.options.envVarSource || "vars";
      workflowBaseUrl = `\${{ ${source}.${this.options.baseUrlEnvVar} }}`;
    } else {
      workflowBaseUrl = this.options.baseUrl!;
    }

    const jobs: string[] = [];

    for (const [jobName, jobDef] of this.jobs.entries()) {
      const schedules = Array.isArray(jobDef.schedule)
        ? jobDef.schedule
        : [jobDef.schedule];

      for (let i = 0; i < schedules.length; i++) {
        const schedule = schedules[i];
        const jobId = schedules.length > 1 ? `${jobName}-${i + 1}` : jobName;
        const url = `${workflowBaseUrl}${this.options.cronPath}/${jobName}`;

        jobs.push(`
  trigger-${jobId}:
    runs-on: ${runner}
    ${jobDef.timeout ? `timeout-minutes: ${Math.ceil(jobDef.timeout / 60)}` : ""}
    if: github.event_name == 'schedule' && github.event.schedule == '${schedule}' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Trigger ${jobName}${schedules.length > 1 ? ` (Schedule ${i + 1})` : ""}
        run: |
          curl -X POST \\
            -H "X-Cron-Secret: \${{ secrets.GITHUBCRON_SECRET }}" \\
            -H "Content-Type: application/json" \\
            -f \\
            ${url}
        ${jobDef.retry !== false ? `continue-on-error: false` : ""}`);
      }
    }

    const scheduleBlocks = Array.from(this.jobs.entries())
      .flatMap(([_, jobDef]) => {
        const schedules = Array.isArray(jobDef.schedule)
          ? jobDef.schedule
          : [jobDef.schedule];
        return schedules.map((s) => `    - cron: '${s}'`);
      })
      .join("\n");

    return `name: ${workflowName}

on:
  schedule:
${scheduleBlocks}
  workflow_dispatch:  # Allows manual trigger from GitHub UI

jobs:${jobs.join("")}
`;
  }

  /**
   * Basic cron expression validation
   *
   * @param expression - Cron expression to validate
   * @returns True if valid
   */
  private isValidCronExpression(expression: string): boolean {
    // Basic validation: 5 or 6 fields separated by spaces
    const parts = expression.trim().split(/\s+/);
    return parts.length === 5 || parts.length === 6;
  }

  /**
   * Internal logging method
   */
  private log(
    message: string,
    level: "info" | "warn" | "error" | "debug",
  ): void {
    if (this.options.logger) {
      this.options.logger(message, level);
    } else if (this.options.debug || level === "error") {
      // Will log to console.error if level is error, otherwise to console.log
      const prefix = `[ServerlessCron:${level.toUpperCase()}]`;
      console[level === "error" ? "error" : "log"](prefix, message);
    }
  }
}
