import { describe, it, expect, beforeEach } from "vitest";
import { ServerlessCron } from "../../src/ServerlessCron";
import {
  createAppRouterHandler,
  createPagesRouterHandler,
} from "../../src/adapters/nextjs";

describe("Next.js Adapters", () => {
  let cron: ServerlessCron;
  const testSecret = "test-secret";

  beforeEach(() => {
    cron = new ServerlessCron({
      secret: testSecret,
      baseUrl: "https://test-app.com",
    });

    cron.job("test-job", {
      schedule: "0 9 * * *",
      handler: async () => ({ success: true }),
    });
  });

  describe("App Router Handler", () => {
    it("should handle valid request", async () => {
      const handler = createAppRouterHandler(cron);

      const request = new Request("https://test-app.com/api/cron/test-job", {
        method: "POST",
        headers: {
          "x-cron-secret": testSecret,
          "content-type": "application/json",
        },
      });

      const context = { params: { job: "test-job" } };
      const response = await handler(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should handle request without body", async () => {
      const handler = createAppRouterHandler(cron);

      const request = new Request("https://test-app.com/api/cron/test-job", {
        method: "POST",
        headers: { "x-cron-secret": testSecret },
      });

      const context = { params: { job: "test-job" } };
      const response = await handler(request, context);

      expect(response.status).toBe(200);
    });
  });

  describe("Pages Router Handler", () => {
    it("should handle valid request", async () => {
      const handler = createPagesRouterHandler(cron);

      const req = {
        query: { job: "test-job" },
        headers: { "x-cron-secret": testSecret },
        body: {},
      };

      const res = {
        status: function (code: number) {
          this.statusCode = code;
          return this;
        },
        json: function (data: any) {
          this.data = data;
          return this;
        },
        setHeader: function () {},
        statusCode: 0,
        data: null,
      };

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it("should handle array job parameter", async () => {
      const handler = createPagesRouterHandler(cron);

      const req = {
        query: { job: ["test-job", "extra"] },
        headers: { "x-cron-secret": testSecret },
        body: {},
      };

      const res = {
        status: function (code: number) {
          this.statusCode = code;
          return this;
        },
        json: function (data: any) {
          this.data = data;
          return this;
        },
        setHeader: function () {},
        statusCode: 0,
        data: null,
      };

      await handler(req, res);

      expect(res.statusCode).toBe(200);
    });

    it("should return 400 for missing job parameter", async () => {
      const handler = createPagesRouterHandler(cron);

      const req = {
        query: {},
        headers: { "x-cron-secret": testSecret },
        body: {},
      };

      const res = {
        status: function (code: number) {
          this.statusCode = code;
          return this;
        },
        json: function (data: any) {
          this.data = data;
          return this;
        },
        statusCode: 0,
        data: null,
      };

      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.data.success).toBe(false);
    });
  });
});
