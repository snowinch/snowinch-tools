/**
 * Security utilities for webhook validation
 */

import { ServerlessCronError } from "../types";

/**
 * Validates the webhook secret from request headers
 *
 * @param headers - Request headers
 * @param expectedSecret - Expected secret token
 * @returns True if valid, throws error otherwise
 */
export function validateSecret(
  headers: Record<string, string>,
  expectedSecret: string
): boolean {
  const headerSecret = headers["x-cron-secret"] || headers["X-Cron-Secret"];

  if (!headerSecret) {
    throw new ServerlessCronError(
      "Missing X-Cron-Secret header",
      "MISSING_SECRET",
      401
    );
  }

  if (headerSecret !== expectedSecret) {
    throw new ServerlessCronError(
      "Invalid secret token",
      "INVALID_SECRET",
      403
    );
  }

  return true;
}

/**
 * Validates that the request method is POST
 *
 * @param method - HTTP method
 * @returns True if POST, throws error otherwise
 */
export function validateMethod(method: string): boolean {
  if (method.toUpperCase() !== "POST") {
    throw new ServerlessCronError(
      "Method not allowed. Only POST is supported.",
      "METHOD_NOT_ALLOWED",
      405
    );
  }

  return true;
}

/**
 * Creates a secure random secret token
 *
 * @param length - Length of the token (default: 32)
 * @returns Random hex string
 */
export function generateSecret(length: number = 32): string {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("hex");
}
