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
      return null;
    default:
      return getNyDateStart();
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: classId, isActive: true },
      select: { id: true, name: true, code: true, section: true, semester: true },
    });

    if (!classRecord) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "today";
    const mode = url.searchParams.get("mode") || "FOCUS";

    const periodStart = getPeriodStart(period);

    // Get users who have joined this class
    const userClasses = await prisma.userClass.findMany({
      where: { classId },
      select: { userId: true },
    });

    const classUserIds = userClasses.map((uc) => uc.userId);
    if (classUserIds.length === 0) {
      return NextResponse.json({
        class: classRecord,
        leaderboard: [],
        currentUserEntry: null,
        period,
        mode,
        hasMore: false,
        nextCursor: null,
      });
    }

    // Aggregate completed session durations for THIS CLASS specifically
    const sessionWhere: any = {
      userId: { in: classUserIds },
      classId,
      mode,
      isActive: false,
      durationSeconds: { gt: 0 },
    };
    if (periodStart) {
      sessionWhere.startedAt = { gte: periodStart };
    }

    const sessionAgg = await prisma.studySession.groupBy({
      by: ["userId"],
      where: sessionWhere,
      _sum: { durationSeconds: true },
    });

    const sessionMap = new Map<string, number>();
    for (const row of sessionAgg) {
      sessionMap.set(row.userId, row._sum.durationSeconds || 0);
    }

    // Get active sessions for this class
    const activeSessions = await prisma.studySession.findMany({
      where: {
        userId: { in: classUserIds },
        classId,
        mode,
        isActive: true,
      },
      select: { userId: true, startedAt: true },
    });

    const activeMap = new Map<string, Date>();
    for (const s of activeSessions) {
      activeMap.set(s.userId, s.startedAt);
    }

    // Fetch user details
    const users = await prisma.user.findMany({
      where: { id: { in: classUserIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isTimerPublic: true,
      },
    });

    const now = Date.now();

    const leaderboard = users.map((u) => {
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
        session:
          isActive && activeStart
            ? { startedAt: activeStart, endedAt: null, isActive: true }
            : null,
        isCurrentUser: u.id === user.id,
      };
    });

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
      class: classRecord,
      leaderboard: rankedLeaderboard,
      currentUserEntry,
      period,
      mode,
      hasMore,
      nextCursor: null,
    });
  } catch (error) {
    console.error("Class leaderboard error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
