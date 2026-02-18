import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getNyDateStart } from "@/lib/date";

const LEADERBOARD_LIMIT = 100;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id, isActive: true },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    const today = getNyDateStart();

    const userLocations = await prisma.userLocation.findMany({
      where: {
        locationId: id,
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isTimerPublic: true,
            isLocationPublic: true,
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
        },
        location: {
          include: {
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
    });

    const leaderboardWithLiveTime = userLocations.map((userLocation) => {
      const dailyStat = userLocation.user.dailyStats[0];
      const baseSeconds = dailyStat?.isPublic ? dailyStat.totalSeconds : 0;
      const isActive = userLocation.user.studySessions[0]?.isActive ?? false;
      const sessionStart = userLocation.user.studySessions[0]?.startedAt;
      const liveSessionSeconds = isActive && sessionStart
        ? Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000)
        : 0;
      const totalLiveSeconds = baseSeconds + liveSessionSeconds;

      return {
        userId: userLocation.user.id,
        username: userLocation.user.username,
        displayName: userLocation.user.displayName,
        avatarUrl: userLocation.user.avatarUrl,
        totalSeconds: baseSeconds,
        totalLiveSeconds,
        isTimerPublic: userLocation.user.isTimerPublic,
        session: userLocation.user.studySessions[0]
          ? {
              startedAt: userLocation.user.studySessions[0].startedAt,
              endedAt: userLocation.user.studySessions[0].endedAt,
              isActive: userLocation.user.studySessions[0].isActive,
            }
          : null,
        location: userLocation.user.isLocationPublic ? userLocation.location : null,
        isCurrentUser: userLocation.user.id === user.id,
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
      location: {
        id: location.id,
        name: location.name,
        slug: location.slug,
        parent: location.parent,
      },
      leaderboard: rankedLeaderboard,
      currentUserEntry,
      date: today.toISOString().split("T")[0],
      hasMore,
      nextCursor: null,
    });
  } catch (error) {
    console.error("Location leaderboard error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
