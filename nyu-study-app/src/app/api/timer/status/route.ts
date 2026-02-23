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
    const mode = url.searchParams.get("mode") === "FOCUS" ? "FOCUS" : "CLASSIC";

    // Get active session (handle both NULL and explicit mode values)
    const activeSession = await prisma.studySession.findFirst({
      where: {
        userId: user.id,
        OR: [
          { mode, isActive: true },
          { mode: null, isActive: true }, // Handle legacy sessions without mode
        ],
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

    // Get today's stats
    const today = getNyDateStart();

    const dailyStat = await prisma.dailyStat.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

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
      totalSecondsToday: dailyStat?.totalSeconds || 0,
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
      // If no active session, get the last paused session's duration for display
      const lastSession = await prisma.studySession.findFirst({
        where: {
          userId: user.id,
          OR: [
            { mode, createdDate: { gte: today } },
            { mode: null, createdDate: { gte: today } }, // Handle legacy sessions without mode
          ],
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
