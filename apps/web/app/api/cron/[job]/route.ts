import { cron } from "@/lib/cron";

export const POST = cron.nextjs.appRouter();

// Opzionale: Endpoint GET per info (solo in development)
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  const jobs = Array.from(cron.getJobs().entries()).map(
    ([name, def]: [string, any]) => ({
      name,
      schedule: def.schedule,
      description: def.description,
    }),
  );

  return Response.json({
    message: "Cron jobs endpoint",
    totalJobs: jobs.length,
    jobs,
  });
}
