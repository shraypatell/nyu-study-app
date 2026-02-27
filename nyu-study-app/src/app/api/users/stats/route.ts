import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getNyDateStart } from "@/lib/date";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get total seconds from study sessions (more reliable)
    const sessionStats = await prisma.studySession.aggregate({
      where: {
        userId: user.id,
        endedAt: { not: null },
        durationSeconds: { gt: 0 },
      },
      _sum: {
        durationSeconds: true,
      },
    });

    const totalSessions = await prisma.studySession.count({
      where: {
        userId: user.id,
        endedAt: { not: null },
      },
    });

    // Get daily stats for streak calculation
    const dailyStats = await prisma.dailyStat.findMany({
      where: {
        userId: user.id,
        totalSeconds: { gt: 0 },
      },
      orderBy: { date: "desc" },
      select: { date: true, totalSeconds: true },
    });

    let currentStreak = 0;
    const today = getNyDateStart();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const studiedToday = dailyStats.some(
      (stat) => stat.date.toISOString().split("T")[0] === today.toISOString().split("T")[0]
    );

    const lastStudyDate = dailyStats[0]?.date;
    const canStartStreak = studiedToday || 
      (lastStudyDate && lastStudyDate.toISOString().split("T")[0] === yesterday.toISOString().split("T")[0]);

    if (canStartStreak) {
      currentStreak = 1;
      for (let i = 1; i < dailyStats.length; i++) {
        const currentDate = dailyStats[i - 1].date;
        const previousDate = dailyStats[i].date;
        const expectedPreviousDate = new Date(currentDate);
        expectedPreviousDate.setDate(expectedPreviousDate.getDate() - 1);
        if (previousDate.toISOString().split("T")[0] === expectedPreviousDate.toISOString().split("T")[0]) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Get today's seconds
    let todaySeconds = 0;
    const todayStat = dailyStats.find(
      (stat) => stat.date.toISOString().split("T")[0] === today.toISOString().split("T")[0]
    );
    if (todayStat) {
      todaySeconds = todayStat.totalSeconds;
    }

    const activeSession = await prisma.studySession.findFirst({
      where: { userId: user.id, isActive: true },
    });

    const totalSeconds = sessionStats._sum.durationSeconds || 0;

    return NextResponse.json({
      totalHours: Math.floor(totalSeconds / 3600),
      totalMinutes: Math.floor((totalSeconds % 3600) / 60),
      totalSeconds,
      totalSessions,
      currentStreak,
      todaySeconds,
      hasActiveSession: !!activeSession,
    });
  } catch (error) {
    console.error("User stats error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
