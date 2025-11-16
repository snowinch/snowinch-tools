#!/usr/bin/env node

/**
 * CLI for @snowinch/githubcron
 */

import { Command } from "commander";
import { initCommand } from "./commands/init";
import { generateCommand } from "./commands/generate";
import { testCommand } from "./commands/test";
import { devCommand } from "./commands/dev";

const program = new Command();

program
  .name("githubcron")
  .description("GitHub Actions powered cron jobs for serverless applications")
  .version("0.0.0");

program
  .command("init")
  .description("Initialize a new cron configuration")
  .option(
    "-f, --framework <framework>",
    "Framework to use (nextjs-app, nextjs-pages, express, fetch)",
    "nextjs-app",
  )
  .option("-d, --dir <directory>", "Output directory", ".")
  .action(initCommand);

program
  .command("generate")
  .description("Generate GitHub Actions workflow from cron configuration")
  .option(
    "-c, --config <path>",
    "Path to cron configuration file",
    "./lib/cron.ts",
  )
  .option(
    "-o, --output <path>",
    "Output path for workflow file",
    ".github/workflows/cron-jobs.yml",
  )
  .action(generateCommand);

program
  .command("dev")
  .description(
    "Start local cron worker for development (simulates GitHub Actions)",
  )
  .option(
    "-c, --config <path>",
    "Path to cron configuration file",
    "./lib/cron.ts",
  )
  .option(
    "-u, --base-url <url>",
    "Base URL for local development",
    "http://localhost:3000",
  )
  .option(
    "-s, --secret <secret>",
    "Secret token (or use GITHUBCRON_SECRET env)",
  )
  .action(devCommand);

program
  .command("test <jobName>")
  .description("Test a cron job locally")
  .option(
    "-c, --config <path>",
    "Path to cron configuration file",
    "./lib/cron.ts",
  )
  .option("-s, --secret <secret>", "Secret token for authentication")
  .action(testCommand);

program.parse();
