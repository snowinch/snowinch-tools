import { ServerlessCron } from "@snowinch/githubcron";

export const cron = new ServerlessCron({
  secret: process.env.GITHUBCRON_SECRET!,
  baseUrl: process.env.APP_URL || "http://localhost:3000",
  cronPath: "/api/cron",

  // Optional: Add logging callbacks
  onJobStart: async (ctx) => {
    console.log(`[CRON] Job "${ctx.jobName}" started at ${ctx.startedAt}`);
  },

  onJobComplete: async (ctx) => {
    console.log(`[CRON] Job "${ctx.jobName}" completed in ${ctx.duration}ms`);
  },

  onJobError: async (ctx) => {
    console.error(`[CRON] Job "${ctx.jobName}" failed:`, ctx.error?.message);
  },
});

// Example job
cron.job("example-job", {
  schedule: "0 9 * * *", // Every day at 9:00 AM
  description: "Example daily job",
  handler: async (ctx) => {
    // Your job logic here
    console.log("Running example job");
    return { success: true };
  },
});
