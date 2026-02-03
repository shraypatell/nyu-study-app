import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getNyDateStart } from "@/lib/date";

const LEADERBOARD_LIMIT = 100;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    const leaderboardWithStats = await Promise.all(
      userLocations.map(async (userLocation: {
        userId: string;
        updatedAt: Date;
        user: {
          id: string;
          username: string;
          displayName: string | null;
          avatarUrl: string | null;
          isTimerPublic: boolean;
          isLocationPublic: boolean;
          studySessions: Array<{
            startedAt: Date;
            endedAt: Date | null;
            isActive: boolean;
          }>;
        };
        location: {
          id: string;
          name: string;
          slug: string;
          parent: {
            id: string;
            name: string;
            slug: string;
          } | null;
        };
      }, index: number) => {
        const dailyStat = await prisma.dailyStat.findUnique({
          where: {
            userId_date: {
              userId: userLocation.userId,
              date: today,
            },
          },
          select: { totalSeconds: true, isPublic: true },
        });

        const isActiveNow = userLocation.user.studySessions[0]?.isActive ?? false;
        const sessionStart = userLocation.user.studySessions[0]?.startedAt;
        const liveSessionSeconds = isActiveNow && sessionStart
          ? Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000)
          : 0;
        const baseSeconds = dailyStat?.isPublic ? dailyStat.totalSeconds : 0;
        const totalLiveSeconds = baseSeconds + liveSessionSeconds;

        return {
          rank: index + 1,
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
          isActiveNow,
          isCurrentUser: userLocation.user.id === user.id,
        };
      })
    );

    const sortedLeaderboard = leaderboardWithStats.sort((a: { totalLiveSeconds: number }, b: { totalLiveSeconds: number }) => b.totalLiveSeconds - a.totalLiveSeconds);

    const hasMore = sortedLeaderboard.length > LEADERBOARD_LIMIT;
    const results = hasMore ? sortedLeaderboard.slice(0, LEADERBOARD_LIMIT) : sortedLeaderboard;

    results.forEach((entry: { rank: number }, index: number) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({
      location: {
        id: location.id,
        name: location.name,
        slug: location.slug,
        parent: location.parent,
      },
      leaderboard: results,
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
