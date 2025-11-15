import { describe, it, expect } from "vitest";
import {
  createJobContext,
  completeJobContext,
  errorJobContext,
} from "../../src/utils/context";

describe("Context Utils", () => {
  describe("createJobContext", () => {
    it("should create a basic job context", () => {
      const headers = { "x-cron-secret": "test" };
      const context = createJobContext("test-job", headers);

      expect(context.jobName).toBe("test-job");
      expect(context.headers).toEqual(headers);
      expect(context.startedAt).toBeInstanceOf(Date);
    });

    it("should include metadata if provided", () => {
      const headers = { "x-cron-secret": "test" };
      const metadata = { user: "test-user" };
      const context = createJobContext("test-job", headers, metadata);

      expect(context.metadata).toEqual(metadata);
    });
  });

  describe("completeJobContext", () => {
    it("should add completion data to context", () => {
      const baseContext = createJobContext("test-job", {});
      const startTime = Date.now() - 1000; // 1 second ago
      const result = { success: true };

      const completeContext = completeJobContext(
        baseContext,
        result,
        startTime
      );

      expect(completeContext.result).toEqual(result);
      expect(completeContext.duration).toBeGreaterThanOrEqual(1000);
      expect(completeContext.duration).toBeLessThan(1100);
    });
  });

  describe("errorJobContext", () => {
    it("should add error data to context", () => {
      const baseContext = createJobContext("test-job", {});
      const startTime = Date.now() - 500;
      const error = new Error("Test error");

      const errorContext = errorJobContext(baseContext, error, startTime);

      expect(errorContext.error).toEqual(error);
      expect(errorContext.duration).toBeGreaterThanOrEqual(500);
      expect(errorContext.duration).toBeLessThan(600);
    });
  });
});
