import { describe, it, expect } from "vitest";
import {
  validateSecret,
  validateMethod,
  generateSecret,
} from "../../src/utils/security";
import { ServerlessCronError } from "../../src/types";

describe("Security Utils", () => {
  describe("validateSecret", () => {
    it("should validate correct secret", () => {
      const headers = { "x-cron-secret": "test-secret" };
      expect(validateSecret(headers, "test-secret")).toBe(true);
    });

    it("should validate secret with capital header name", () => {
      const headers = { "X-Cron-Secret": "test-secret" };
      expect(validateSecret(headers, "test-secret")).toBe(true);
    });

    it("should throw error for missing secret", () => {
      const headers = {};
      expect(() => validateSecret(headers, "test-secret")).toThrow(
        ServerlessCronError
      );
      expect(() => validateSecret(headers, "test-secret")).toThrow(
        "Missing X-Cron-Secret header"
      );
    });

    it("should throw error for invalid secret", () => {
      const headers = { "x-cron-secret": "wrong-secret" };
      expect(() => validateSecret(headers, "test-secret")).toThrow(
        ServerlessCronError
      );
      expect(() => validateSecret(headers, "test-secret")).toThrow(
        "Invalid secret token"
      );
    });
  });

  describe("validateMethod", () => {
    it("should validate POST method", () => {
      expect(validateMethod("POST")).toBe(true);
      expect(validateMethod("post")).toBe(true);
    });

    it("should throw error for non-POST methods", () => {
      expect(() => validateMethod("GET")).toThrow(ServerlessCronError);
      expect(() => validateMethod("PUT")).toThrow(ServerlessCronError);
      expect(() => validateMethod("DELETE")).toThrow(ServerlessCronError);
    });
  });

  describe("generateSecret", () => {
    it("should generate a secret of default length", () => {
      const secret = generateSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it("should generate a secret of custom length", () => {
      const secret = generateSecret(16);
      expect(secret.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it("should generate different secrets", () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });
});
