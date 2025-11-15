/**
 * Generate command - Generate GitHub Actions workflow
 */

import * as fs from "fs";
import * as path from "path";
import jiti from "jiti";
import { config as loadDotenv } from "dotenv";

interface GenerateOptions {
  config: string;
  output: string;
}

/**
 * Find git repository root
 */
function findGitRoot(startPath: string): string | null {
  let currentPath = path.resolve(startPath);

  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, ".git"))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

export async function generateCommand(options: GenerateOptions) {
  let { config, output } = options;

  console.log("🔧 Generating GitHub Actions workflow...");

  try {
    const configPath = path.resolve(process.cwd(), config);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    // Use jiti to import TypeScript files from compiled JavaScript
    const jitiLoader = jiti(process.cwd(), {
      interopDefault: true,
      esmResolve: true,
    });

    // Import the cron configuration (works with both .ts and .js)
    const cronModule = jitiLoader(configPath);
    const cron = cronModule.cron || cronModule.default;

    if (!cron) {
      throw new Error(
        'Could not find "cron" export in configuration file. Make sure you export: export const cron = new ServerlessCron(...)'
      );
    }

    // Check configuration
    if (cron.options.baseUrlEnvVar) {
      const source = cron.options.envVarSource || "vars";
      console.log(
        `🌐 Using environment variable: \${{ ${source}.${cron.options.baseUrlEnvVar} }}`
      );
      console.log(
        `💡 Make sure to set ${cron.options.baseUrlEnvVar} in GitHub ${source === "vars" ? "Variables" : "Secrets"}`
      );
    } else {
      console.log(`🌐 Using hardcoded URL: ${cron.options.baseUrl}`);
      const baseUrl = cron.options.baseUrl || "";
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
        console.warn("\n⚠️  WARNING: Using localhost in production workflow!");
        console.warn(
          "Consider using baseUrlEnvVar instead for environment-specific URLs.\n"
        );
      }
    }

    // Find git root for output path
    const gitRoot = findGitRoot(process.cwd());

    // Get workflow name and generate filename
    const workflowName = cron.getWorkflowName();
    const defaultOutput = `.github/workflows/${workflowName}.yml`;

    // Use custom output or default based on workflow name
    if (output === ".github/workflows/cron-jobs.yml") {
      // Default was used, replace with workflow-specific name
      output = defaultOutput;
    }

    // If output is relative and we found git root, resolve from git root
    if (!path.isAbsolute(output) && gitRoot) {
      output = path.join(gitRoot, output);
      console.log(`📁 Using git repository root: ${gitRoot}`);
    } else if (!gitRoot) {
      // Fallback to current directory
      output = path.resolve(process.cwd(), output);
      console.warn("⚠️  Could not find git root, using current directory");
    }

    console.log(`📝 Workflow name: ${workflowName}`);

    // Generate workflow
    const workflow = cron.generateGitHubWorkflow();

    // Write workflow file
    const outputPath = path.resolve(output);
    const outputDir = path.dirname(outputPath);

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, workflow);

    console.log(`✅ Generated workflow: ${outputPath}`);
    console.log("\n📝 Next steps:");
    if (cron.options.baseUrlEnvVar) {
      const source = cron.options.envVarSource || "vars";
      const settingsPath =
        source === "vars"
          ? "Settings > Secrets and variables > Actions > Variables"
          : "Settings > Secrets and variables > Actions > Secrets";
      console.log(
        `1. Add ${cron.options.baseUrlEnvVar} to GitHub (${settingsPath})`
      );
      console.log(
        `   Example: ${cron.options.baseUrlEnvVar}=https://my-app.vercel.app`
      );
    } else {
      console.log("1. Make sure your baseUrl is correct in the cron config");
    }
    console.log(
      "2. Add GITHUBCRON_SECRET to GitHub Secrets (Settings > Secrets > Actions)"
    );
    console.log("3. Commit and push the workflow file");
    console.log("4. Your cron jobs will run automatically!");
    console.log("\n✨ Done!");
  } catch (error) {
    console.error("❌ Error generating workflow:", error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}
