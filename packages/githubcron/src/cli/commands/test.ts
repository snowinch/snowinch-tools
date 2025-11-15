/**
 * Test command - Test a cron job locally
 */

import * as path from "path";
import * as fs from "fs";

interface TestOptions {
  config: string;
  secret?: string;
}

export async function testCommand(jobName: string, options: TestOptions) {
  const { config, secret } = options;

  console.log(`🧪 Testing job: ${jobName}`);

  try {
    const configPath = path.resolve(process.cwd(), config);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    // Import the cron configuration
    const cronModule = await import(configPath);
    const cron = cronModule.cron || cronModule.default;

    if (!cron) {
      throw new Error('Could not find "cron" export in configuration file');
    }

    // Get the secret
    const testSecret = secret || process.env.GITHUBCRON_SECRET;

    if (!testSecret) {
      throw new Error(
        "Secret is required. Provide via --secret flag or GITHUBCRON_SECRET env variable"
      );
    }

    // Create test request
    const request = {
      jobName,
      headers: {
        "x-cron-secret": testSecret,
        "content-type": "application/json",
      },
      body: {},
    };

    console.log("⏱️  Executing job...\n");

    const startTime = Date.now();
    const response = await cron.handleRequest(request);
    const duration = Date.now() - startTime;

    if (response.status === 200) {
      console.log(`✅ Job completed successfully in ${duration}ms`);
      console.log("\nResponse:");
      console.log(JSON.stringify(response.body, null, 2));
    } else {
      console.error(`❌ Job failed with status ${response.status}`);
      console.error("\nResponse:");
      console.error(JSON.stringify(response.body, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error testing job:", error);
    process.exit(1);
  }
}
