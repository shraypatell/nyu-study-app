import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const LEADERBOARD_LIMIT = 100;

export async function GET(request: Request) {
  try {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaderboard = await prisma.dailyStat.findMany({
      where: {
        date: today,
        isPublic: true,
        totalSeconds: { gt: 0 },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { totalSeconds: "desc" },
      take: LEADERBOARD_LIMIT + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    const hasMore = leaderboard.length > LEADERBOARD_LIMIT;
    const results = hasMore ? leaderboard.slice(0, LEADERBOARD_LIMIT) : leaderboard;

    const rankedLeaderboard = results.map((entry: {
      totalSeconds: number;
      user: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
      };
    }, index: number) => ({
      rank: cursor ? parseInt(atob(cursor).split(":")[1] || "0") + index + 1 : index + 1,
      userId: entry.user.id,
      username: entry.user.username,
      displayName: entry.user.displayName,
      avatarUrl: entry.user.avatarUrl,
      totalSeconds: entry.totalSeconds,
      isCurrentUser: entry.user.id === user.id,
    }));

    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    let currentUserEntry = null;
    if (!cursor) {
      const currentUserStat = await prisma.dailyStat.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (currentUserStat && currentUserStat.isPublic) {
        const userRank = await prisma.dailyStat.count({
          where: {
            date: today,
            isPublic: true,
            totalSeconds: { gt: currentUserStat.totalSeconds },
          },
        });

        currentUserEntry = {
          rank: userRank + 1,
          userId: currentUserStat.user.id,
          username: currentUserStat.user.username,
          displayName: currentUserStat.user.displayName,
          avatarUrl: currentUserStat.user.avatarUrl,
          totalSeconds: currentUserStat.totalSeconds,
          isCurrentUser: true,
        };
      }
    }

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      currentUserEntry,
      date: today.toISOString().split("T")[0],
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("School leaderboard error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
