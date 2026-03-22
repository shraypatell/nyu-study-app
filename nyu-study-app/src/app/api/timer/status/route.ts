import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { getNyDateStart } from "@/lib/date";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const requestedMode = url.searchParams.get("mode");
    const mode = requestedMode === "FOCUS" ? "FOCUS" : "CLASSIC";

    // Get active session for the specified mode
    const activeSession = await prisma.studySession.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        mode: mode,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Compute today's total from completed sessions for this specific mode
    // This matches the leaderboard computation exactly
    const today = getNyDateStart();

    const todayAgg = await prisma.studySession.aggregate({
      where: {
        userId: user.id,
        mode: mode,
        isActive: false,
        durationSeconds: { gt: 0 },
        startedAt: { gte: today },
      },
      _sum: { durationSeconds: true },
    });

    const totalSecondsToday = todayAgg._sum.durationSeconds || 0;

    const response: {
      isActive: boolean;
      startedAt?: Date;
      currentDuration?: number;
      currentSessionDuration?: number;
      totalSecondsToday: number;
      lastSessionDuration?: number;
      currentClass?: {
        id: string;
        name: string;
        code: string;
      } | null;
    } = {
      isActive: !!activeSession,
      totalSecondsToday,
    };

    if (activeSession) {
      const now = new Date();
      const currentDuration = Math.floor(
        (now.getTime() - activeSession.startedAt.getTime()) / 1000
      );
      response.startedAt = activeSession.startedAt;
      response.currentDuration = currentDuration;
      response.currentSessionDuration = currentDuration;
      response.currentClass = activeSession.class;
    } else {
      // Get last session for this mode
      const lastSession = await prisma.studySession.findFirst({
        where: {
          userId: user.id,
          isActive: false,
          mode: mode,
          durationSeconds: { gt: 0 },
          startedAt: { gte: today },
        },
        orderBy: { startedAt: 'desc' },
      });

      if (lastSession && lastSession.durationSeconds > 0) {
        response.lastSessionDuration = lastSession.durationSeconds;
        response.currentSessionDuration = lastSession.durationSeconds;
      } else {
        response.currentSessionDuration = 0;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Timer status error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
