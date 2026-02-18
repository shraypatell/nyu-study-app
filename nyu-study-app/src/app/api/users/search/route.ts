import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

const MAX_RESULTS = 20;
const MIN_QUERY_LENGTH = 2;

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const cursor = searchParams.get("cursor");

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Query must be at least ${MIN_QUERY_LENGTH} characters` },
        { status: 400 }
      );
    }

    const searchPattern = `%${query}%`;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { displayName: { contains: query, mode: "insensitive" } },
            ],
          },
          { id: { not: user.id } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isTimerPublic: true,
      },
      take: MAX_RESULTS + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { username: "asc" },
    });

    const hasMore = users.length > MAX_RESULTS;
    const results = hasMore ? users.slice(0, MAX_RESULTS) : users;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    return NextResponse.json({
      users: results,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
