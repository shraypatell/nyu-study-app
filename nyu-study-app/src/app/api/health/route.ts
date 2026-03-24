import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
      nodeEnv: process.env.NODE_ENV,
    },
  };

  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    checks.database = { connected: true, result };
  } catch (error: unknown) {
    const err = error as Error;
    checks.database = {
      connected: false,
      error: err.message,
      stack: err.stack?.split("\n").slice(0, 5),
    };
  }

  try {
    const userCount = await prisma.user.count();
    checks.userCount = userCount;
  } catch (error: unknown) {
    const err = error as Error;
    checks.userQuery = {
      error: err.message,
      stack: err.stack?.split("\n").slice(0, 5),
    };
  }

  const ok = (checks.database as Record<string, unknown>)?.connected === true;
  return NextResponse.json(checks, { status: ok ? 200 : 500 });
}
