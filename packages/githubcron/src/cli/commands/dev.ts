/**
 * Dev command - Start local cron worker
 * Simulates GitHub Actions cron scheduler for local development
 */

import * as path from "path";
import * as fs from "fs";
import jiti from "jiti";
import { config as loadDotenv } from "dotenv";
import type { ServerlessCron } from "../../ServerlessCron";
import type { JobDefinition } from "../../types";

interface DevOptions {
  config: string;
  baseUrl: string;
  secret?: string;
}

export async function devCommand(options: DevOptions) {
  const { config, baseUrl, secret } = options;

  // Auto-load .env files (.env.local, .env)
  const envLocalPath = path.join(process.cwd(), ".env.local");
  const envPath = path.join(process.cwd(), ".env");

  if (fs.existsSync(envLocalPath)) {
    loadDotenv({ path: envLocalPath });
    console.log("📄 Loaded .env.local");
  } else if (fs.existsSync(envPath)) {
    loadDotenv({ path: envPath });
    console.log("📄 Loaded .env");
  }

  console.log("🚀 Starting local cron worker...");
  console.log(`📁 Config: ${config}`);
  console.log(`🌐 Base URL: ${baseUrl}`);

  try {
    const configPath = path.resolve(process.cwd(), config);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    // Use jiti to import TypeScript files
    const jitiLoader = jiti(process.cwd(), {
      interopDefault: true,
      esmResolve: true,
    });

    // Import the cron configuration
    const cronModule = jitiLoader(configPath) as any;
    const cron = (cronModule.cron || cronModule.default) as ServerlessCron;

    if (!cron) {
      throw new Error('Could not find "cron" export in configuration file');
    }

    const cronSecret = secret || process.env.GITHUBCRON_SECRET;

    if (!cronSecret) {
      throw new Error(
        "GITHUBCRON_SECRET not found. Provide via --secret flag or GITHUBCRON_SECRET environment variable"
      );
    }

    // Resolve baseUrl from environment variable if specified
    let resolvedBaseUrl = baseUrl;
    const baseUrlEnvVar = cron.getBaseUrlEnvVar();
    if (baseUrlEnvVar) {
      const envValue = process.env[baseUrlEnvVar];
      if (envValue) {
        resolvedBaseUrl = envValue;
        console.log(
          `🌐 Using ${baseUrlEnvVar}=${resolvedBaseUrl} from environment`
        );
      } else {
        console.warn(
          `⚠️  Environment variable ${baseUrlEnvVar} not found, using --base-url flag: ${baseUrl}`
        );
      }
    }

    // Get all jobs
    const jobs = Array.from(cron.getJobs().entries()) as Array<
      [string, JobDefinition]
    >;

    if (jobs.length === 0) {
      console.warn("⚠️  No cron jobs found in configuration");
      process.exit(0);
    }

    console.log(`\n✅ Found ${jobs.length} job(s):`);
    for (const [name, def] of jobs) {
      const schedules = Array.isArray(def.schedule)
        ? def.schedule
        : [def.schedule];
      console.log(`  - ${name}: ${schedules.join(", ")}`);
    }

    // Import cron parser
    const cronParser = await import("cron-parser");
    const parseExpression =
      cronParser.parseExpression ||
      (cronParser as any).default?.parseExpression ||
      (cronParser as any).default;

    console.log("\n⏰ Scheduling jobs with cron-parser...\n");

    // Schedule all jobs
    const scheduledJobs: NodeJS.Timeout[] = [];

    for (const [jobName, jobDef] of jobs) {
      const schedules = Array.isArray(jobDef.schedule)
        ? jobDef.schedule
        : [jobDef.schedule];

      for (const schedule of schedules) {
        try {
          const interval = parseExpression(schedule);
          const next = interval.next().toDate();

          console.log(
            `📅 ${jobName} (${schedule}): next run at ${next.toLocaleString()}`
          );

          // Calculate time until next run
          const delay = next.getTime() - Date.now();

          const scheduleJob = () => {
            console.log(`\n🔔 Triggering job: ${jobName}`);

            // Call the local endpoint
            const url = `${resolvedBaseUrl}${cron.getCronPath()}/${jobName}`;

            console.log(`📡 POST ${url}`);
            console.log(
              `🔐 Headers: X-Cron-Secret: ${cronSecret.substring(0, 8)}***`
            );

            fetch(url, {
              method: "POST",
              headers: {
                "X-Cron-Secret": cronSecret,
                "Content-Type": "application/json",
              },
            })
              .then(async (response) => {
                console.log(
                  `📥 Response: ${response.status} ${response.statusText}`
                );

                const contentType = response.headers.get("content-type");
                if (contentType?.includes("application/json")) {
                  return response.json();
                } else {
                  const text = await response.text();
                  console.error(
                    `❌ Non-JSON response: ${text.substring(0, 200)}`
                  );
                  throw new Error(`Invalid response type: ${contentType}`);
                }
              })
              .then((data) => {
                if (data.success) {
                  console.log(`✅ ${jobName} completed:`, data.result);
                } else {
                  console.error(`❌ ${jobName} failed:`, data.error);
                }
              })
              .catch((error) => {
                console.error(`❌ ${jobName} error:`, error.message);
                if (error.cause) {
                  console.error(`   Cause:`, error.cause);
                }
              });

            // Reschedule
            const nextInterval = parseExpression(schedule);
            const nextRun = nextInterval.next().toDate();
            const nextDelay = nextRun.getTime() - Date.now();

            console.log(
              `📅 ${jobName} rescheduled for ${nextRun.toLocaleString()}`
            );

            setTimeout(scheduleJob, nextDelay);
          };

          scheduledJobs.push(setTimeout(scheduleJob, delay));
        } catch (error) {
          console.error(
            `❌ Error scheduling ${jobName} (${schedule}):`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    }

    console.log("\n✨ Local cron worker is running! Press Ctrl+C to stop.\n");

    // Keep process alive
    process.on("SIGINT", () => {
      console.log("\n\n👋 Stopping cron worker...");
      scheduledJobs.forEach((job) => clearTimeout(job));
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error starting dev worker:", error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}
