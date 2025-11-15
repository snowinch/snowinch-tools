import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "**/*.test.ts",
        "**/*.config.ts",
        "src/cli/**", // CLI tested separately if needed
      ],
    },
    globals: true,
    environment: "node",
  },
});
