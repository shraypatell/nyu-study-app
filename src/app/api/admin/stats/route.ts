import { prisma } from "@/lib/prisma";
import { getNyDateStart } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (ADMIN_SECRET && authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = getNyDateStart();

    const [
      totalUsers,
      activeUsersToday,
      totalStudySessions,
      activeTimers,
      totalClasses,
      totalLocations,
      totalMessages,
      todaysStudyTime,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.dailyStat.count({
        where: {
          date: today,
          totalSeconds: { gt: 0 },
        },
      }),
      prisma.studySession.count(),
      prisma.studySession.count({
        where: { isActive: true },
      }),
      prisma.class.count({ where: { isActive: true } }),
      prisma.location.count({ where: { isActive: true } }),
      prisma.message.count(),
      prisma.dailyStat.aggregate({
        where: { date: today },
        _sum: { totalSeconds: true },
      }),
    ]);

    const topStudiers = await prisma.dailyStat.findMany({
      where: {
        date: today,
        totalSeconds: { gt: 0 },
      },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { totalSeconds: "desc" },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsersToday,
        totalStudySessions,
        activeTimers,
        totalClasses,
        totalLocations,
        totalMessages,
        todaysTotalStudyTime: todaysStudyTime._sum.totalSeconds || 0,
      },
      topStudiers: topStudiers.map((stat: { user: { username: string; displayName: string | null }; totalSeconds: number }) => ({
        username: stat.user.username,
        displayName: stat.user.displayName,
        totalSeconds: stat.totalSeconds,
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
