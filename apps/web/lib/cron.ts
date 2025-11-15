import { ServerlessCron } from "@snowinch-tools/githubcron";

export const cron = new ServerlessCron({
  name: "web-app-cron", // Nome del gruppo cron → genera "web-app-cron.yml"
  secret: process.env.GITHUBCRON_SECRET,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  baseUrlEnvVar: "GITHUBCRON_APP_URL", // GitHub Actions will use ${{ vars.GITHUBCRON_APP_URL }}
  envVarSource: "vars", // Use GitHub Variables (not Secrets)
  cronPath: "/api/cron",

  // Logging callbacks - in produzione potresti salvare su DB
  onJobStart: async (ctx) => {
    console.log(`[CRON START] ${ctx.jobName} - ${ctx.startedAt.toISOString()}`);
  },

  onJobComplete: async (ctx) => {
    console.log(
      `[CRON SUCCESS] ${ctx.jobName} - Duration: ${ctx.duration}ms`,
      ctx.result
    );
  },

  onJobError: async (ctx) => {
    console.error(
      `[CRON ERROR] ${ctx.jobName} - ${ctx.error?.message}`,
      ctx.error
    );
  },
});

// Job 0: Health check ping (test rapido)
cron.job("ping", {
  schedule: "* * * * *", // Ogni minuto (frequenza massima cron)
  description: "Health check ping - test job",
  handler: async (ctx) => {
    console.log("🏓 PING! Server is alive!");
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  },
});

// Job 1: Invio email giornaliere
cron.job("send-daily-digest", {
  schedule: "0 9 * * *", // Ogni giorno alle 9:00 AM
  description: "Send daily digest emails to all users",
  handler: async (ctx) => {
    console.log("📧 Sending daily digest emails...");

    // Simula il caricamento degli utenti
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In un caso reale, qui faresti:
    // const users = await db.user.findMany({ where: { emailVerified: true } });
    // await Promise.all(users.map(user => sendEmail(user)));

    return {
      sent: 150,
      failed: 2,
      timestamp: new Date().toISOString(),
    };
  },
});

// Job 2: Pulizia dati vecchi
cron.job("cleanup-old-data", {
  schedule: "0 2 * * 0", // Ogni domenica alle 2:00 AM
  description: "Cleanup old data and logs",
  handler: async (ctx) => {
    console.log("🧹 Cleaning up old data...");

    await new Promise((resolve) => setTimeout(resolve, 300));

    // In un caso reale:
    // const deleted = await db.logs.deleteMany({
    //   where: { createdAt: { lt: thirtyDaysAgo() } }
    // });

    return {
      logsDeleted: 1234,
      cacheCleared: true,
      timestamp: new Date().toISOString(),
    };
  },
});

// Job 3: Sync dati esterni (multiple schedule)
cron.job("sync-external-data", {
  schedule: ["0 */6 * * *", "0 0 * * *"], // Ogni 6 ore + mezzanotte
  description: "Sync data from external APIs",
  handler: async (ctx) => {
    console.log("🔄 Syncing external data...");

    await new Promise((resolve) => setTimeout(resolve, 400));

    // Simula un errore casuale per testare error handling
    if (Math.random() > 0.8) {
      throw new Error("External API timeout");
    }

    return {
      synced: 567,
      errors: 0,
      timestamp: new Date().toISOString(),
    };
  },
});
