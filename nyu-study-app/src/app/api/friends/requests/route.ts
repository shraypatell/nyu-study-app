import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

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
    const type = searchParams.get("type") || "received";

    let friendships;

    if (type === "received") {
      friendships = await prisma.friendship.findMany({
        where: {
          addresseeId: user.id,
          status: "PENDING",
        },
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const requests = friendships.map((f: { id: string; status: string; requester: { id: string; username: string; displayName: string | null; avatarUrl: string | null }; createdAt: Date }) => ({
        id: f.id,
        status: f.status,
        requester: f.requester,
        createdAt: f.createdAt,
      }));

      return NextResponse.json({ requests });
    } else {
      friendships = await prisma.friendship.findMany({
        where: {
          requesterId: user.id,
          status: "PENDING",
        },
        include: {
          addressee: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const sent = friendships.map((f: { id: string; status: string; addressee: { id: string; username: string; displayName: string | null; avatarUrl: string | null }; createdAt: Date }) => ({
        id: f.id,
        status: f.status,
        addressee: f.addressee,
        createdAt: f.createdAt,
      }));

      return NextResponse.json({ sent });
    }
  } catch (error) {
    console.error("Get friend requests error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
