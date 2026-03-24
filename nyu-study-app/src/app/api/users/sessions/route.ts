import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
    const cursor = url.searchParams.get("cursor");

    const sessions = await prisma.studySession.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        mode: true,
        startedAt: true,
        endedAt: true,
        durationSeconds: true,
        isActive: true,
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    const hasMore = sessions.length > limit;
    const results = hasMore ? sessions.slice(0, limit) : sessions;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    return NextResponse.json({
      sessions: results.map((s) => ({
        id: s.id,
        mode: s.mode,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt?.toISOString() || null,
        durationSeconds: s.durationSeconds,
        isActive: s.isActive,
        className: s.class?.name || null,
        classCode: s.class?.code || null,
      })),
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
