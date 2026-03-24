import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
  };

  // Test DB
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    checks.database = { connected: true, result };
  } catch (error: unknown) {
    const err = error as Error;
    checks.database = { connected: false, error: err.message };
  }

  // Test auth (the actual code path that runs on every endpoint)
  try {
    const user = await getAuthenticatedUser(request);
    checks.auth = { success: !!user, userId: user?.id || null };
  } catch (error: unknown) {
    const err = error as Error;
    checks.auth = {
      success: false,
      threw: true,
      error: err.message,
      stack: err.stack?.split("\n").slice(0, 5),
    };
  }

  // Test classes query (same as /api/classes)
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
    checks.classesQuery = { error: err.message };
  }

  return NextResponse.json(checks);
}
