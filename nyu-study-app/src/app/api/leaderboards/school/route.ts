import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getNyDateStart } from "@/lib/date";

const LEADERBOARD_LIMIT = 100;

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = getNyDateStart();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isTimerPublic: true,
        isLocationPublic: true,
        userLocations: {
          take: 1,
          select: {
            location: {
              select: {
                id: true,
                name: true,
                slug: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        studySessions: {
          take: 1,
          orderBy: { startedAt: "desc" },
          select: {
            startedAt: true,
            endedAt: true,
            isActive: true,
          },
        },
        dailyStats: {
          where: { date: today },
          take: 1,
          select: {
            totalSeconds: true,
            isPublic: true,
          },
        },
      },
    });

    const leaderboardWithLiveTime = users.map((entry) => {
      const dailyStat = entry.dailyStats[0];
      const baseSeconds = dailyStat?.isPublic ? dailyStat.totalSeconds : 0;
      const isActive = entry.studySessions[0]?.isActive ?? false;
      const sessionStart = entry.studySessions[0]?.startedAt;
      const liveSessionSeconds = isActive && sessionStart
        ? Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000)
        : 0;
      const totalLiveSeconds = baseSeconds + liveSessionSeconds;

      return {
        userId: entry.id,
        username: entry.username,
        displayName: entry.displayName,
        avatarUrl: entry.avatarUrl,
        totalSeconds: baseSeconds,
        totalLiveSeconds,
        isTimerPublic: entry.isTimerPublic,
        session: entry.studySessions[0]
          ? {
              startedAt: entry.studySessions[0].startedAt,
              endedAt: entry.studySessions[0].endedAt,
              isActive: entry.studySessions[0].isActive,
            }
          : null,
        location: entry.isLocationPublic ? entry.userLocations[0]?.location || null : null,
        isCurrentUser: entry.id === user.id,
      };
    });

    const sortedLeaderboard = leaderboardWithLiveTime.sort((a, b) => b.totalLiveSeconds - a.totalLiveSeconds);

    const hasMore = sortedLeaderboard.length > LEADERBOARD_LIMIT;
    const results = hasMore ? sortedLeaderboard.slice(0, LEADERBOARD_LIMIT) : sortedLeaderboard;

    const rankedLeaderboard = results.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    const currentUserIndex = sortedLeaderboard.findIndex((entry) => entry.isCurrentUser);
    const currentUserEntry = currentUserIndex >= 0
      ? {
          rank: currentUserIndex + 1,
          ...sortedLeaderboard[currentUserIndex],
        }
      : null;

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      currentUserEntry,
      date: today.toISOString().split("T")[0],
      hasMore,
      nextCursor: null,
    });
  } catch (error) {
    console.error("School leaderboard error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
