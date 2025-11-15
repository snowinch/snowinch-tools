/**
 * Init command - Initialize cron configuration
 */

import * as fs from "fs";
import * as path from "path";

interface InitOptions {
  framework: string;
  dir: string;
}

export async function initCommand(options: InitOptions) {
  const { framework, dir } = options;

  console.log(`🚀 Initializing githubcron for ${framework}...`);

  const targetDir = path.resolve(process.cwd(), dir);

  try {
    // Create directories
    if (framework.startsWith("nextjs-app")) {
      const libDir = path.join(targetDir, "lib");
      const apiDir = path.join(targetDir, "app", "api", "cron", "[job]");

      fs.mkdirSync(libDir, { recursive: true });
      fs.mkdirSync(apiDir, { recursive: true });

      // Copy templates
      const cronTemplate = getTemplate("nextjs-app-cron.ts");
      const routeTemplate = getTemplate("nextjs-app-route.ts");

      fs.writeFileSync(path.join(libDir, "cron.ts"), cronTemplate);
      fs.writeFileSync(path.join(apiDir, "route.ts"), routeTemplate);

      console.log("✅ Created lib/cron.ts");
      console.log("✅ Created app/api/cron/[job]/route.ts");
    } else if (framework.startsWith("nextjs-pages")) {
      const libDir = path.join(targetDir, "lib");
      const apiDir = path.join(targetDir, "pages", "api", "cron");

      fs.mkdirSync(libDir, { recursive: true });
      fs.mkdirSync(apiDir, { recursive: true });

      // Copy templates
      const cronTemplate = getTemplate("nextjs-pages-cron.ts");
      const routeTemplate = getTemplate("nextjs-pages-route.ts");

      fs.writeFileSync(path.join(libDir, "cron.ts"), cronTemplate);
      fs.writeFileSync(path.join(apiDir, "[job].ts"), routeTemplate);

      console.log("✅ Created lib/cron.ts");
      console.log("✅ Created pages/api/cron/[job].ts");
    } else if (framework === "express") {
      const libDir = path.join(targetDir, "lib");

      fs.mkdirSync(libDir, { recursive: true });

      // Copy templates
      const cronTemplate = getTemplate("express-cron.ts");
      const serverTemplate = getTemplate("express-server.ts");

      fs.writeFileSync(path.join(libDir, "cron.ts"), cronTemplate);
      fs.writeFileSync(path.join(targetDir, "server.ts"), serverTemplate);

      console.log("✅ Created lib/cron.ts");
      console.log("✅ Created server.ts (example)");
    }

    // Create .env.example
    const envTemplate = getTemplate("env-example.txt");
    const envPath = path.join(targetDir, ".env.example");

    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envTemplate);
      console.log("✅ Created .env.example");
    }

    console.log("\n📝 Next steps:");
    console.log("1. Copy .env.example to .env and set your GITHUBCRON_SECRET");
    console.log("2. Run: npx githubcron generate");
    console.log(
      "3. Add GITHUBCRON_SECRET to GitHub Secrets (Settings > Secrets > Actions)"
    );
    console.log("4. Commit and push the generated workflow file");
    console.log("\n✨ Done!");
  } catch (error) {
    console.error("❌ Error during initialization:", error);
    process.exit(1);
  }
}

function getTemplate(filename: string): string {
  const templatePath = path.join(__dirname, "..", "templates", filename);
  return fs.readFileSync(templatePath, "utf-8");
}
