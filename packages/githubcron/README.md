# @snowinch-tools/githubcron

GitHub Actions powered cron jobs for serverless applications. Framework-agnostic with built-in adapters for Next.js, Express, and standard Fetch API.

## Features

- ✅ **Zero infrastructure** - Uses GitHub Actions as scheduler (2000 free minutes/month)
- ✅ **Framework agnostic** - Works with Next.js, Express, Cloudflare Workers, Deno, Bun, and more
- ✅ **Environment-aware** - Dynamic URLs via GitHub Variables (local/preview/production)
- ✅ **Type-safe** - Full TypeScript support with strict types
- ✅ **Flexible logging** - Custom callbacks for job lifecycle events
- ✅ **Secure** - Built-in webhook secret validation
- ✅ **Easy setup** - CLI tool for quick initialization
- ✅ **Local development** - Test cron jobs locally with dev worker
- ✅ **No vendor lock-in** - Works with any deployment platform

## Installation

```bash
npm install @snowinch-tools/githubcron
```

## Quick Start

### 1. Initialize

```bash
npx githubcron init --framework nextjs-app
```

This creates:
- `lib/cron.ts` - Your cron configuration
- `app/api/cron/[job]/route.ts` - API endpoint
- `.env.example` - Environment variables template

### 2. Configure Jobs

Edit `lib/cron.ts`:

```typescript
import { ServerlessCron } from '@snowinch-tools/githubcron';

export const cron = new ServerlessCron({
  name: 'my-app-cron', // Optional: workflow name (generates my-app-cron.yml)
  secret: process.env.GITHUBCRON_SECRET,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  baseUrlEnvVar: 'GITHUBCRON_APP_URL', // GitHub Actions will use ${{ vars.GITHUBCRON_APP_URL }}
  envVarSource: 'vars', // Use GitHub Variables (not Secrets)
  
  // Optional: Custom logging
  onJobComplete: async (ctx) => {
    await db.logs.create({
      job: ctx.jobName,
      duration: ctx.duration,
      result: ctx.result,
    });
  },
});

// Define your jobs
cron.job('send-daily-emails', {
  schedule: '0 9 * * *', // Every day at 9:00 AM
  handler: async (ctx) => {
    const emails = await sendDailyEmails();
    return { sent: emails.length };
  },
});

cron.job('cleanup-old-data', {
  schedule: '0 0 * * 0', // Every Sunday at midnight
  handler: async () => {
    await cleanupOldData();
  },
});
```

### 3. Generate GitHub Workflow

```bash
npx githubcron generate
```

This creates `.github/workflows/<your-workflow-name>.yml` (defaults to `cron-jobs.yml`).

### 4. Setup GitHub Secrets & Variables

**Required:**
1. Go to Settings > Secrets and variables > Actions > **Secrets**
2. Create new secret named `GITHUBCRON_SECRET`
3. Generate a value: `openssl rand -hex 32`

**If using environment variables for baseUrl:**
1. Go to Settings > Secrets and variables > Actions > **Variables**
2. Create new variable named `GITHUBCRON_APP_URL` (or your custom name)
3. Set value to your production URL (e.g., `https://my-app.vercel.app`)

### 5. Deploy

Commit and push! Your cron jobs will run automatically.

---

## Usage by Framework

### Next.js (App Router)

**Setup:**
```bash
npx githubcron init --framework nextjs-app
```

**File structure:**
```
├── lib/cron.ts                    # Cron configuration
└── app/api/cron/[job]/route.ts   # API endpoint
```

**`lib/cron.ts`:**
```typescript
import { ServerlessCron } from '@snowinch-tools/githubcron';

export const cron = new ServerlessCron({
  secret: process.env.GITHUBCRON_SECRET!,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
  cronPath: '/api/cron',
});

cron.job('example-job', {
  schedule: '0 9 * * *',
  handler: async (ctx) => {
    // Your logic here
    return { success: true };
  },
});
```

**`app/api/cron/[job]/route.ts`:**
```typescript
import { cron } from '@/lib/cron';

export const POST = cron.nextjs.appRouter();
```

---

### Next.js (Pages Router)

**Setup:**
```bash
npx githubcron init --framework nextjs-pages
```

**File structure:**
```
├── lib/cron.ts              # Cron configuration
└── pages/api/cron/[job].ts  # API endpoint
```

**`pages/api/cron/[job].ts`:**
```typescript
import { cron } from '@/lib/cron';

export default cron.nextjs.pagesRouter();
```

---

### Express

**Setup:**
```bash
npx githubcron init --framework express
```

**`lib/cron.ts`:**
```typescript
import { ServerlessCron } from '@snowinch-tools/githubcron';

export const cron = new ServerlessCron({
  secret: process.env.GITHUBCRON_SECRET!,
  baseUrl: process.env.APP_URL!,
  cronPath: '/api/cron',
});

cron.job('example-job', {
  schedule: '0 9 * * *',
  handler: async () => {
    return { success: true };
  },
});
```

**`server.ts`:**
```typescript
import express from 'express';
import { cron } from './lib/cron';

const app = express();
app.use(express.json());

// Mount cron endpoint
app.post('/api/cron/:job', cron.express.handler());

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

### Cloudflare Workers

**`src/cron.ts`:**
```typescript
import { ServerlessCron } from '@snowinch-tools/githubcron';

export const cron = new ServerlessCron({
  secret: process.env.GITHUBCRON_SECRET!,
  baseUrl: 'https://your-worker.workers.dev',
  cronPath: '/cron',
});

cron.job('example-job', {
  schedule: '0 9 * * *',
  handler: async () => {
    return { success: true };
  },
});
```

**`src/index.ts`:**
```typescript
import { cron } from './cron';

export default {
  fetch: cron.fetch.handler(),
};
```

---

### Deno Deploy

**`cron.ts`:**
```typescript
import { ServerlessCron } from 'npm:@snowinch-tools/githubcron';

export const cron = new ServerlessCron({
  secret: Deno.env.get('GITHUBCRON_SECRET')!,
  baseUrl: 'https://your-app.deno.dev',
});

cron.job('example-job', {
  schedule: '0 9 * * *',
  handler: async () => {
    return { success: true };
  },
});
```

**`main.ts`:**
```typescript
import { cron } from './cron.ts';

Deno.serve(cron.fetch.handler());
```

---

## API Reference

### `ServerlessCron`

Main class for managing cron jobs.

#### Constructor

```typescript
new ServerlessCron(options: ServerlessCronOptions)
```

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | No | Workflow name (used for filename generation) |
| `secret` | `string` | No* | Secret token for webhook validation (*required for runtime) |
| `baseUrl` | `string` | No | Base URL of your app (for local development) |
| `baseUrlEnvVar` | `string` | No | GitHub variable name for base URL (e.g., `GITHUBCRON_APP_URL`) |
| `envVarSource` | `'vars' \| 'secrets'` | No | Use GitHub Variables or Secrets (default: `'vars'`) |
| `cronPath` | `string` | No | Path prefix for cron endpoints (default: `/api/cron`) |
| `onJobStart` | `function` | No | Callback when job starts |
| `onJobComplete` | `function` | No | Callback when job completes |
| `onJobError` | `function` | No | Callback when job fails |
| `debug` | `boolean` | No | Enable debug logging (default: `false`) |
| `logger` | `function` | No | Custom logger function |

#### Methods

##### `job(name: string, definition: JobDefinition)`

Register a new cron job.

```typescript
cron.job('job-name', {
  schedule: '0 9 * * *',
  description: 'Optional description',
  handler: async (ctx) => {
    // Your logic
    return result;
  },
});
```

**JobDefinition:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `schedule` | `string \| string[]` | ✅ | Cron expression(s) |
| `handler` | `function` | ✅ | Job handler function |
| `description` | `string` | No | Job description |
| `timeout` | `number` | No | Timeout in seconds (for GitHub Actions) |
| `retry` | `boolean` | No | Enable retry on failure (default: `true`) |

##### `generateGitHubWorkflow(config?: WorkflowConfig): string`

Generate GitHub Actions workflow YAML.

```typescript
const workflow = cron.generateGitHubWorkflow({
  name: 'Custom Workflow Name',
  runner: 'ubuntu-latest',
});
```

##### `handleRequest(request: CronRequest): Promise<CronResponse>`

Handle incoming webhook request (used internally by adapters).

---

## Lifecycle Callbacks

Track job execution with custom callbacks:

```typescript
const cron = new ServerlessCron({
  secret: process.env.GITHUBCRON_SECRET,
  
  onJobStart: async (ctx) => {
    console.log(`Job ${ctx.jobName} started`);
    await db.logs.create({
      job: ctx.jobName,
      status: 'started',
      startedAt: ctx.startedAt,
    });
  },
  
  onJobComplete: async (ctx) => {
    console.log(`Job ${ctx.jobName} completed in ${ctx.duration}ms`);
    await db.logs.update({
      job: ctx.jobName,
      status: 'completed',
      duration: ctx.duration,
      result: ctx.result,
    });
  },
  
  onJobError: async (ctx) => {
    console.error(`Job ${ctx.jobName} failed:`, ctx.error);
    await db.logs.create({
      job: ctx.jobName,
      status: 'failed',
      error: ctx.error?.message,
      duration: ctx.duration,
    });
  },
});
```

**Context Object:**

```typescript
interface JobContext {
  jobName: string;
  startedAt: Date;
  duration?: number;      // Available in onJobComplete/onJobError
  result?: any;           // Available in onJobComplete
  error?: Error;          // Available in onJobError
  headers: Record<string, string>;
  metadata?: Record<string, any>;
}
```

---

## Environment-Specific URLs

Configure different URLs for local, preview, and production environments using GitHub Variables or Secrets.

### Method 1: Using GitHub Variables (Recommended)

```typescript
export const cron = new ServerlessCron({
  secret: process.env.GITHUBCRON_SECRET,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  baseUrlEnvVar: 'GITHUBCRON_APP_URL', // GitHub will use ${{ vars.GITHUBCRON_APP_URL }}
  envVarSource: 'vars', // Use GitHub Variables (default)
});
```

**Setup in GitHub:**
1. Go to Settings > Secrets and variables > Actions > **Variables** tab
2. Add variable: `GITHUBCRON_APP_URL` = `https://my-app.vercel.app`

**Generated workflow will use:**
```yaml
curl -X POST https://my-app.vercel.app/api/cron/job-name
        # Uses ${{ vars.GITHUBCRON_APP_URL }}
```

### Method 2: Using GitHub Secrets

```typescript
export const cron = new ServerlessCron({
  secret: process.env.GITHUBCRON_SECRET,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  baseUrlEnvVar: 'GITHUBCRON_APP_URL',
  envVarSource: 'secrets', // Use GitHub Secrets instead
});
```

### Method 3: Hardcoded URL (Not Recommended)

```typescript
export const cron = new ServerlessCron({
  secret: process.env.GITHUBCRON_SECRET,
  baseUrl: 'https://my-app.vercel.app', // Hardcoded production URL
  // No baseUrlEnvVar needed
});
```

⚠️ **Warning**: The workflow will always call the hardcoded URL, even in local development.

### Local Development

The `dev` command always uses `http://localhost:3000` (or custom `--base-url`):

```bash
# Start your app
npm run dev

# Start local cron worker
npx githubcron dev
```

The dev worker will:
- Load `.env.local` or `.env` automatically
- Override `baseUrl` with `http://localhost:3000`
- Make HTTP calls to your local server

---

## CLI Commands

### `init`

Initialize a new cron configuration.

```bash
npx githubcron init [options]
```

**Options:**
- `-f, --framework <framework>` - Framework to use (`nextjs-app`, `nextjs-pages`, `express`, `fetch`)
- `-d, --dir <directory>` - Output directory (default: `.`)

**Example:**
```bash
npx githubcron init --framework nextjs-app
```

### `generate`

Generate GitHub Actions workflow from cron configuration.

```bash
npx githubcron generate [options]
```

**Options:**
- `-c, --config <path>` - Path to cron config file (default: `./lib/cron.ts`)
- `-o, --output <path>` - Output path for workflow (default: `.github/workflows/cron-jobs.yml`)

**Example:**
```bash
npx githubcron generate --config ./src/cron.ts
```

### `dev`

Start local cron worker for development (simulates GitHub Actions).

```bash
npx githubcron dev [options]
```

**Options:**
- `-c, --config <path>` - Path to cron config file (default: `./lib/cron.ts`)
- `-u, --base-url <url>` - Base URL for local development (default: `http://localhost:3000`)
- `-s, --secret <secret>` - Secret token (or use `GITHUBCRON_SECRET` env variable)

**Example:**
```bash
# Start your app server
npm run dev

# In another terminal, start the cron worker
npx githubcron dev
```

The dev worker will:
- Read your cron configuration
- Schedule all jobs locally
- Trigger HTTP calls to your local server at the specified times
- Show detailed logs for debugging

### `test`

Test a specific cron job locally (one-time execution).

```bash
npx githubcron test <jobName> [options]
```

**Options:**
- `-c, --config <path>` - Path to cron config file (default: `./lib/cron.ts`)
- `-s, --secret <secret>` - Secret token (or use `GITHUBCRON_SECRET` env variable)

**Example:**
```bash
npx githubcron test send-daily-emails --secret your-secret
```

---

## Cron Schedule Examples

```typescript
// Every minute
'* * * * *'

// Every hour at minute 0
'0 * * * *'

// Every day at 9:00 AM
'0 9 * * *'

// Every Monday at 8:00 AM
'0 8 * * 1'

// Every 1st day of month at midnight
'0 0 1 * *'

// Every 15 minutes
'*/15 * * * *'

// Multiple schedules
cron.job('multi-schedule', {
  schedule: ['0 9 * * *', '0 18 * * *'], // 9 AM and 6 PM
  handler: async () => {},
});
```

[Cron expression reference](https://crontab.guru/)

---

## Platform Limits

| Platform | Max Timeout | Notes |
|----------|-------------|-------|
| **Vercel (Hobby)** | 10 seconds | Upgrade for longer timeouts |
| **Vercel (Pro)** | 60 seconds | - |
| **Cloudflare Workers** | 30 seconds CPU | - |
| **AWS Lambda** | 15 minutes | - |
| **Deno Deploy** | 10 seconds | - |
| **Express (self-hosted)** | Unlimited | Depends on your hosting |

For long-running jobs, consider:
- Breaking into smaller tasks
- Using a job queue
- Self-hosting with Express/Node.js

---

## Security

### Webhook Secret

Always use a strong secret token:

```bash
# Generate secure secret
openssl rand -hex 32
```

Add to `.env`:
```bash
GITHUBCRON_SECRET=your-generated-secret-here
```

Add to GitHub Secrets:
1. Repository Settings > Secrets and variables > Actions
2. New repository secret
3. Name: `GITHUBCRON_SECRET`
4. Value: your-generated-secret

### IP Whitelisting

If your platform supports IP whitelisting, you can restrict access to GitHub Actions IPs:
[GitHub Actions IP ranges](https://api.github.com/meta)

---

## Troubleshooting

### Job not executing

1. Check GitHub Actions tab in your repository
2. Verify `GITHUBCRON_SECRET` is set in GitHub Secrets
3. Ensure workflow file is committed to `.github/workflows/`
4. Check cron expression is valid

### Authentication errors

1. Verify secret matches between GitHub Secrets and `.env`
2. Check header name is `X-Cron-Secret`
3. Ensure secret is passed in workflow file

### Timeouts

1. Check platform-specific timeout limits
2. Optimize job execution time
3. Consider breaking into smaller jobs
4. Use background tasks or queues for long operations

### Testing locally

```bash
# Test a specific job
npx githubcron test my-job --secret your-secret

# Or start your dev server and curl
curl -X POST http://localhost:3000/api/cron/my-job \
  -H "X-Cron-Secret: your-secret"
```

---

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  ServerlessCronOptions,
  JobDefinition,
  JobContext,
  JobHandler,
  OnJobStartCallback,
  OnJobCompleteCallback,
  OnJobErrorCallback,
  CronRequest,
  CronResponse,
} from '@snowinch-tools/githubcron';
```

---

## Examples

### Database Backup Job

```typescript
cron.job('backup-database', {
  schedule: '0 2 * * *', // 2 AM daily
  handler: async () => {
    const backup = await createDatabaseBackup();
    await uploadToS3(backup);
    return { backupSize: backup.size };
  },
});
```

### Email Digest

```typescript
cron.job('daily-digest', {
  schedule: '0 9 * * *', // 9 AM daily
  handler: async () => {
    const users = await getActiveUsers();
    const sent = await Promise.all(
      users.map(user => sendDigestEmail(user))
    );
    return { sent: sent.length };
  },
});
```

### Cleanup Old Records

```typescript
cron.job('cleanup-old-records', {
  schedule: '0 0 * * 0', // Midnight every Sunday
  handler: async () => {
    const deleted = await db.records.deleteMany({
      createdAt: { lt: thirtyDaysAgo() },
    });
    return { deleted: deleted.count };
  },
});
```

---

## License

MIT

---

## Contributing

Issues and pull requests are welcome!

Repository: [https://github.com/snowinch/snowinch-tools](https://github.com/snowinch/snowinch-tools)

---

## Related Packages

- `@snowinch-tools/html-to-pdf` - HTML to PDF conversion
- More coming soon!

