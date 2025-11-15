import { describe, it, expect, beforeEach } from "vitest";
import { ServerlessCron } from "../../src/ServerlessCron";
import { createFetchHandler } from "../../src/adapters/fetch";

describe("Fetch Adapter", () => {
  let cron: ServerlessCron;
  const testSecret = "test-secret";

  beforeEach(() => {
    cron = new ServerlessCron({
      secret: testSecret,
      baseUrl: "https://test-app.com",
      cronPath: "/api/cron",
    });

    cron.job("test-job", {
      schedule: "0 9 * * *",
      handler: async () => ({ success: true }),
    });
  });

  it("should handle valid request", async () => {
    const handler = createFetchHandler(cron, "/api/cron");

    const request = new Request("https://test-app.com/api/cron/test-job", {
      method: "POST",
      headers: {
        "x-cron-secret": testSecret,
        "content-type": "application/json",
      },
    });

    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should extract job name from path", async () => {
    const handler = createFetchHandler(cron, "/api/cron");

    const request = new Request("https://test-app.com/api/cron/test-job", {
      method: "POST",
      headers: { "x-cron-secret": testSecret },
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
  });

  it("should return 400 for invalid path", async () => {
    const handler = createFetchHandler(cron, "/api/cron");

    const request = new Request("https://test-app.com/wrong/path", {
      method: "POST",
      headers: { "x-cron-secret": testSecret },
    });

    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should handle trailing slashes in path", async () => {
    const handler = createFetchHandler(cron, "/api/cron/");

    const request = new Request("https://test-app.com/api/cron/test-job", {
      method: "POST",
      headers: { "x-cron-secret": testSecret },
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
  });
});
