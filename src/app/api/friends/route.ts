import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const sendRequestSchema = z.object({
  userId: z.string().uuid(),
});

const rateLimits = new Map<string, number>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimits.get(userId);

  if (lastRequest && now - lastRequest < 1000) {
    return false;
  }

  rateLimits.set(userId, now);
  return true;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validationResult = sendRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { userId: addresseeId } = validationResult.data;

    if (user.id === addresseeId) {
      return NextResponse.json(
        { error: "Cannot send friend request to yourself" },
        { status: 400 }
      );
    }

    const addresseeExists = await prisma.user.findUnique({
      where: { id: addresseeId },
      select: { id: true },
    });

    if (!addresseeExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: user.id, addresseeId },
          { requesterId: addresseeId, addresseeId: user.id },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "Already friends with this user" },
          { status: 400 }
        );
      }
      if (existingFriendship.status === "PENDING") {
        return NextResponse.json(
          { error: "Friend request already pending" },
          { status: 400 }
        );
      }
      if (existingFriendship.status === "BLOCKED") {
        return NextResponse.json(
          { error: "Cannot send friend request to this user" },
          { status: 400 }
        );
      }
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: user.id,
        addresseeId,
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
    });

    return NextResponse.json({
      success: true,
      friendship: {
        id: friendship.id,
        status: friendship.status,
        addressee: friendship.addressee,
        createdAt: friendship.createdAt,
      },
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

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

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: user.id, status: "ACCEPTED" },
          { addresseeId: user.id, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: {
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
          },
        },
        addressee: {
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
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const friends = friendships.map((friendship: {
      id: string;
      requesterId: string;
      addressee: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
        isTimerPublic: boolean;
        isLocationPublic: boolean;
        userLocations: Array<{
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
        }>;
        studySessions: Array<{
          startedAt: Date;
          endedAt: Date | null;
          isActive: boolean;
        }>;
      };
      requester: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
        isTimerPublic: boolean;
        isLocationPublic: boolean;
        userLocations: Array<{
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
        }>;
        studySessions: Array<{
          startedAt: Date;
          endedAt: Date | null;
          isActive: boolean;
        }>;
      };
      updatedAt: Date;
    }) => {
      const friend = friendship.requesterId === user.id
        ? friendship.addressee
        : friendship.requester;
      return {
        friendshipId: friendship.id,
        user: {
          ...friend,
          location: friend.isLocationPublic ? friend.userLocations[0]?.location || null : null,
          session: friend.studySessions[0]
            ? {
                startedAt: friend.studySessions[0].startedAt,
                endedAt: friend.studySessions[0].endedAt,
                isActive: friend.studySessions[0].isActive,
              }
            : null,
        },
        since: friendship.updatedAt,
      };
    });

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Get friends error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
