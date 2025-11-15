import { describe, it, expect, beforeEach, vi } from "vitest";
import { ServerlessCron } from "../src/ServerlessCron";
import { ServerlessCronError } from "../src/types";

describe("ServerlessCron", () => {
  let cron: ServerlessCron;
  const testSecret = "test-secret-12345";

  beforeEach(() => {
    cron = new ServerlessCron({
      secret: testSecret,
      baseUrl: "https://test-app.com",
      cronPath: "/api/cron",
    });
  });

  describe("constructor", () => {
    it("should initialize with required options", () => {
      expect(cron).toBeDefined();
      expect(cron.nextjs).toBeDefined();
      expect(cron.express).toBeDefined();
      expect(cron.fetch).toBeDefined();
    });

    it("should throw error if secret is missing", () => {
      expect(() => {
        new ServerlessCron({} as any);
      }).toThrow(ServerlessCronError);
    });

    it("should use default values for optional options", () => {
      const cronWithDefaults = new ServerlessCron({
        secret: testSecret,
      });

      expect(cronWithDefaults).toBeDefined();
    });
  });

  describe("job registration", () => {
    it("should register a job successfully", () => {
      cron.job("test-job", {
        schedule: "0 9 * * *",
        handler: async () => ({ success: true }),
      });

      const jobs = cron.getJobs();
      expect(jobs.has("test-job")).toBe(true);
    });

    it("should throw error for duplicate job names", () => {
      cron.job("test-job", {
        schedule: "0 9 * * *",
        handler: async () => ({}),
      });

      expect(() => {
        cron.job("test-job", {
          schedule: "0 10 * * *",
          handler: async () => ({}),
        });
      }).toThrow(ServerlessCronError);
    });

    it("should accept multiple schedules for a job", () => {
      cron.job("multi-schedule-job", {
        schedule: ["0 9 * * *", "0 18 * * *"],
        handler: async () => ({}),
      });

      const jobs = cron.getJobs();
      const job = jobs.get("multi-schedule-job");
      expect(Array.isArray(job?.schedule)).toBe(true);
      expect((job?.schedule as string[]).length).toBe(2);
    });

    it("should validate cron expressions", () => {
      expect(() => {
        cron.job("invalid-job", {
          schedule: "invalid cron",
          handler: async () => ({}),
        });
      }).toThrow(ServerlessCronError);
    });
  });

  describe("handleRequest", () => {
    beforeEach(() => {
      cron.job("test-job", {
        schedule: "0 9 * * *",
        handler: async (ctx) => {
          return { executed: true, jobName: ctx.jobName };
        },
      });
    });

    it("should execute a job successfully", async () => {
      const response = await cron.handleRequest({
        jobName: "test-job",
        headers: { "x-cron-secret": testSecret },
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toEqual({
        executed: true,
        jobName: "test-job",
      });
    });

    it("should reject request with invalid secret", async () => {
      const response = await cron.handleRequest({
        jobName: "test-job",
        headers: { "x-cron-secret": "wrong-secret" },
      });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject request with missing secret", async () => {
      const response = await cron.handleRequest({
        jobName: "test-job",
        headers: {},
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent job", async () => {
      const response = await cron.handleRequest({
        jobName: "non-existent-job",
        headers: { "x-cron-secret": testSecret },
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should handle job errors gracefully", async () => {
      cron.job("failing-job", {
        schedule: "0 9 * * *",
        handler: async () => {
          throw new Error("Job failed");
        },
      });

      const response = await cron.handleRequest({
        jobName: "failing-job",
        headers: { "x-cron-secret": testSecret },
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Job failed");
    });
  });

  describe("lifecycle callbacks", () => {
    it("should call onJobStart callback", async () => {
      const onJobStart = vi.fn();
      const cronWithCallbacks = new ServerlessCron({
        secret: testSecret,
        onJobStart,
      });

      cronWithCallbacks.job("test-job", {
        schedule: "0 9 * * *",
        handler: async () => ({}),
      });

      await cronWithCallbacks.handleRequest({
        jobName: "test-job",
        headers: { "x-cron-secret": testSecret },
      });

      expect(onJobStart).toHaveBeenCalledOnce();
      expect(onJobStart).toHaveBeenCalledWith(
        expect.objectContaining({
          jobName: "test-job",
          startedAt: expect.any(Date),
        })
      );
    });

    it("should call onJobComplete callback on success", async () => {
      const onJobComplete = vi.fn();
      const cronWithCallbacks = new ServerlessCron({
        secret: testSecret,
        onJobComplete,
      });

      cronWithCallbacks.job("test-job", {
        schedule: "0 9 * * *",
        handler: async () => ({ result: "success" }),
      });

      await cronWithCallbacks.handleRequest({
        jobName: "test-job",
        headers: { "x-cron-secret": testSecret },
      });

      expect(onJobComplete).toHaveBeenCalledOnce();
      expect(onJobComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          jobName: "test-job",
          result: { result: "success" },
          duration: expect.any(Number),
        })
      );
    });

    it("should call onJobError callback on failure", async () => {
      const onJobError = vi.fn();
      const cronWithCallbacks = new ServerlessCron({
        secret: testSecret,
        onJobError,
      });

      cronWithCallbacks.job("failing-job", {
        schedule: "0 9 * * *",
        handler: async () => {
          throw new Error("Job failed");
        },
      });

      await cronWithCallbacks.handleRequest({
        jobName: "failing-job",
        headers: { "x-cron-secret": testSecret },
      });

      expect(onJobError).toHaveBeenCalledOnce();
      expect(onJobError).toHaveBeenCalledWith(
        expect.objectContaining({
          jobName: "failing-job",
          error: expect.any(Error),
          duration: expect.any(Number),
        })
      );
    });
  });

  describe("generateGitHubWorkflow", () => {
    it("should generate workflow file successfully", () => {
      cron.job("daily-job", {
        schedule: "0 9 * * *",
        description: "Daily job",
        handler: async () => ({}),
      });

      const workflow = cron.generateGitHubWorkflow();

      expect(workflow).toContain("name: Serverless Cron Jobs");
      expect(workflow).toContain("cron: '0 9 * * *'");
      expect(workflow).toContain("https://test-app.com/api/cron/daily-job");
      expect(workflow).toContain("X-Cron-Secret: ${{ secrets.CRON_SECRET }}");
    });

    it("should throw error if baseUrl is missing", () => {
      const cronWithoutUrl = new ServerlessCron({
        secret: testSecret,
      });

      cronWithoutUrl.job("test-job", {
        schedule: "0 9 * * *",
        handler: async () => ({}),
      });

      expect(() => {
        cronWithoutUrl.generateGitHubWorkflow();
      }).toThrow(ServerlessCronError);
    });

    it("should handle multiple schedules in workflow", () => {
      cron.job("multi-schedule-job", {
        schedule: ["0 9 * * *", "0 18 * * *"],
        handler: async () => ({}),
      });

      const workflow = cron.generateGitHubWorkflow();

      expect(workflow).toContain("cron: '0 9 * * *'");
      expect(workflow).toContain("cron: '0 18 * * *'");
      expect(workflow).toContain("trigger-multi-schedule-job-1");
      expect(workflow).toContain("trigger-multi-schedule-job-2");
    });

    it("should apply custom workflow config", () => {
      cron.job("test-job", {
        schedule: "0 9 * * *",
        handler: async () => ({}),
      });

      const workflow = cron.generateGitHubWorkflow({
        name: "Custom Cron Jobs",
        runner: "macos-latest",
      });

      expect(workflow).toContain("name: Custom Cron Jobs");
      expect(workflow).toContain("runs-on: macos-latest");
    });
  });

  describe("framework adapters", () => {
    it("should provide Next.js adapter", () => {
      expect(cron.nextjs).toBeDefined();
      expect(cron.nextjs.appRouter).toBeDefined();
      expect(cron.nextjs.pagesRouter).toBeDefined();
    });

    it("should provide Express adapter", () => {
      expect(cron.express).toBeDefined();
      expect(cron.express.handler).toBeDefined();
    });

    it("should provide Fetch adapter", () => {
      expect(cron.fetch).toBeDefined();
      expect(cron.fetch.handler).toBeDefined();
    });
  });
});
