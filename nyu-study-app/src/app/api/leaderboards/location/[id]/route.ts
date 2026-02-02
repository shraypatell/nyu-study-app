import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      orderBy: { updatedAt: "desc" },
      take: LEADERBOARD_LIMIT + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    const hasMore = userLocations.length > LEADERBOARD_LIMIT;
    const results = hasMore ? userLocations.slice(0, LEADERBOARD_LIMIT) : userLocations;

    const leaderboardWithStats = await Promise.all(
      results.map(async (userLocation: {
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

        return {
          rank: cursor ? parseInt(atob(cursor).split(":".charAt(0))[1] || "0") + index + 1 : index + 1,
          userId: userLocation.user.id,
          username: userLocation.user.username,
          displayName: userLocation.user.displayName,
          avatarUrl: userLocation.user.avatarUrl,
          totalSeconds: dailyStat?.isPublic ? dailyStat.totalSeconds : 0,
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

    const sortedLeaderboard = leaderboardWithStats.sort((a: { totalSeconds: number }, b: { totalSeconds: number }) => b.totalSeconds - a.totalSeconds);

    sortedLeaderboard.forEach((entry: { rank: number }, index: number) => {
      entry.rank = cursor ? parseInt(atob(cursor).split(":".charAt(0))[1] || "0") + index + 1 : index + 1;
    });

    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    return NextResponse.json({
      location: {
        id: location.id,
        name: location.name,
        slug: location.slug,
        parent: location.parent,
      },
      leaderboard: sortedLeaderboard,
      date: today.toISOString().split("T".charAt(0))[0],
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Location leaderboard error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
