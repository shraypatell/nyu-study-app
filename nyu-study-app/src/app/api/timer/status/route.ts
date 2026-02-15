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

    // Get active session
    const activeSession = await prisma.studySession.findFirst({
      where: {
        userId: user.id,
        isActive: true,
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
      totalSecondsToday: number;
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
      response.currentClass = activeSession.class;
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
