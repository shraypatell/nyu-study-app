import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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
    checks.userQuery = { error: err.message };
  }

  // Test the exact classes query
  try {
    const classes = await prisma.class.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { userClasses: true } },
        chatRoom: { select: { id: true } },
      },
      take: 2,
    });
    checks.classesQuery = { ok: true, count: classes.length };
  } catch (error: unknown) {
    const err = error as Error;
    checks.classesQuery = { error: err.message, name: (err as any).code || (err as any).name };
  }

  // Test locations query
  try {
    const locations = await prisma.location.findMany({ take: 2 });
    checks.locationsQuery = { ok: true, count: locations.length };
  } catch (error: unknown) {
    const err = error as Error;
    checks.locationsQuery = { error: err.message };
  }

  // Test auth header parsing (without actually validating token)
  const authHeader = request.headers.get("authorization");
  checks.auth = {
    hasAuthHeader: !!authHeader,
    headerPrefix: authHeader?.substring(0, 15) + "...",
  };

  const ok = (checks.database as Record<string, unknown>)?.connected === true;
  return NextResponse.json(checks, { status: ok ? 200 : 500 });
}
