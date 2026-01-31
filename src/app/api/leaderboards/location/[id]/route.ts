import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const LEADERBOARD_LIMIT = 100;
const ACTIVE_THRESHOLD_MINUTES = 60;

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
      select: { id: true, name: true, slug: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeThreshold = new Date();
    activeThreshold.setMinutes(activeThreshold.getMinutes() - ACTIVE_THRESHOLD_MINUTES);

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
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
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

        const isActiveNow = userLocation.updatedAt > activeThreshold;

        return {
          rank: cursor ? parseInt(atob(cursor).split(":")[1] || "0") + index + 1 : index + 1,
          userId: userLocation.user.id,
          username: userLocation.user.username,
          displayName: userLocation.user.displayName,
          avatarUrl: userLocation.user.avatarUrl,
          totalSeconds: dailyStat?.isPublic ? dailyStat.totalSeconds : 0,
          isActiveNow,
          isCurrentUser: userLocation.user.id === user.id,
        };
      })
    );

    const sortedLeaderboard = leaderboardWithStats.sort((a: { totalSeconds: number }, b: { totalSeconds: number }) => b.totalSeconds - a.totalSeconds);

    sortedLeaderboard.forEach((entry: { rank: number }, index: number) => {
      entry.rank = cursor ? parseInt(atob(cursor).split(":")[1] || "0") + index + 1 : index + 1;
    });

    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    return NextResponse.json({
      location: {
        id: location.id,
        name: location.name,
        slug: location.slug,
      },
      leaderboard: sortedLeaderboard,
      date: today.toISOString().split("T")[0],
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
