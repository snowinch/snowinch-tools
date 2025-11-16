import { config } from "@repo/eslint-config/base";

/**
 * ESLint configuration for @snowinch/githubcron package
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...config,
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
];
