import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getNyDateStart } from "@/lib/date";

const LEADERBOARD_LIMIT = 100;

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "today":
      return getNyDateStart();
    case "week": {
      // Start of current week (Sunday)
      const nyFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "short",
      });
      const dayName = nyFormatter.format(now);
      const dayMap: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
      };
      const dayOffset = dayMap[dayName] || 0;
      return getNyDateStart(now, -dayOffset);
    }
    case "month": {
      const nyParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(now);
      const day = parseInt(
        nyParts.find((p) => p.type === "day")?.value || "1",
        10
      );
      return getNyDateStart(now, -(day - 1));
    }
    case "all":
      return null; // no lower bound
    default:
      return getNyDateStart(); // default to today
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "today";
    const mode = url.searchParams.get("mode") || "FOCUS";

    const periodStart = getPeriodStart(period);

    // Build session filter
    const sessionWhere: any = {
      mode,
      isActive: false,
      durationSeconds: { gt: 0 },
    };
    if (periodStart) {
      sessionWhere.startedAt = { gte: periodStart };
    }

    // Aggregate completed session durations per user
    const sessionAgg = await prisma.studySession.groupBy({
      by: ["userId"],
      where: sessionWhere,
      _sum: { durationSeconds: true },
    });

    const sessionMap = new Map<string, number>();
    for (const row of sessionAgg) {
      sessionMap.set(row.userId, row._sum.durationSeconds || 0);
    }

    // Get active FOCUS sessions for live time
    const activeSessions = await prisma.studySession.findMany({
      where: { mode, isActive: true },
      select: { userId: true, startedAt: true },
    });

    const activeMap = new Map<string, Date>();
    for (const s of activeSessions) {
      activeMap.set(s.userId, s.startedAt);
    }

    // Get all user IDs that have either sessions or active timers
    const allUserIds = new Set([...sessionMap.keys(), ...activeMap.keys()]);

    // Fetch user details
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(allUserIds) } },
      select: {
        id: true,
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
                parent: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    const now = Date.now();

    const leaderboard = users
      .map((u) => {
        const baseSeconds = sessionMap.get(u.id) || 0;
        const activeStart = activeMap.get(u.id);
        const isActive = !!activeStart;
        const liveSessionSeconds =
          isActive && activeStart
            ? Math.floor((now - new Date(activeStart).getTime()) / 1000)
            : 0;
        const totalLiveSeconds = baseSeconds + liveSessionSeconds;

        return {
          userId: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          totalSeconds: baseSeconds,
          totalLiveSeconds,
          isTimerPublic: u.isTimerPublic,
          isActive,
          session: isActive && activeStart
            ? { startedAt: activeStart, endedAt: null, isActive: true }
            : null,
          location: u.isLocationPublic
            ? u.userLocations[0]?.location || null
            : null,
          isCurrentUser: u.id === user.id,
        };
      })
      .filter((e) => e.totalLiveSeconds > 0 || e.isCurrentUser);

    leaderboard.sort((a, b) => b.totalLiveSeconds - a.totalLiveSeconds);

    const hasMore = leaderboard.length > LEADERBOARD_LIMIT;
    const results = hasMore
      ? leaderboard.slice(0, LEADERBOARD_LIMIT)
      : leaderboard;

    const rankedLeaderboard = results.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    const currentUserIndex = leaderboard.findIndex((e) => e.isCurrentUser);
    const currentUserEntry =
      currentUserIndex >= 0
        ? { rank: currentUserIndex + 1, ...leaderboard[currentUserIndex] }
        : null;

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      currentUserEntry,
      period,
      mode,
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
