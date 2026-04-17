import { NextResponse } from "next/server";
import { withDatabaseRetry } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();

  try {
    await withDatabaseRetry((prisma) => prisma.$queryRaw`SELECT 1`);

    return NextResponse.json({
      app: "ok",
      database: "ok",
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown health-check failure.";

    return NextResponse.json(
      {
        app: "degraded",
        database: "error",
        message,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptimeMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
