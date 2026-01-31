import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createRoomSchema = z.object({
  type: z.enum(["DM"]),
  userId: z.string().uuid(),
});

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

    const body = await request.json();
    const validationResult = createRoomSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { userId: otherUserId } = validationResult.data;

    if (user.id === otherUserId) {
      return NextResponse.json(
        { error: "Cannot create DM with yourself" },
        { status: 400 }
      );
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    if (!otherUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        type: "DM",
        AND: [
          { users: { some: { userId: user.id } } },
          { users: { some: { userId: otherUserId } } },
        ],
      },
    });

    if (existingRoom) {
      return NextResponse.json({
        success: true,
        room: {
          id: existingRoom.id,
          type: existingRoom.type,
          otherUser,
        },
      });
    }

    const room = await prisma.chatRoom.create({
      data: {
        type: "DM",
        users: {
          create: [
            { userId: user.id },
            { userId: otherUserId },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        type: room.type,
        otherUser,
      },
    });
  } catch (error) {
    console.error("Create chat room error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const chatRooms = await prisma.chatRoomUser.findMany({
      where: { userId: user.id },
      include: {
        room: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            users: {
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
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { lastReadAt: "desc" },
    });

    const formattedRooms = chatRooms.map((chatRoomUser: typeof chatRooms[0]) => {
      const room = chatRoomUser.room;
      const lastMessage = room.messages[0];

      let roomName: string;
      let roomAvatar: string | null = null;

      if (room.type === "CLASS" && room.class) {
        roomName = room.class.name;
      } else {
        const otherUser = room.users.find(
          (u: { userId: string; user: { displayName: string | null; username: string; avatarUrl: string | null } }) => u.userId !== user.id
        )?.user;
        roomName = otherUser?.displayName || otherUser?.username || "Unknown";
        roomAvatar = otherUser?.avatarUrl || null;
      }

      return {
        id: room.id,
        type: room.type,
        name: roomName,
        avatarUrl: roomAvatar,
        class: room.class,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              sender: lastMessage.sender,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount: 0,
      };
    });

    const classRooms = formattedRooms.filter((r: { type: string }) => r.type === "CLASS");
    const dmRooms = formattedRooms.filter((r: { type: string }) => r.type === "DM");

    return NextResponse.json({
      rooms: formattedRooms,
      classRooms,
      dmRooms,
    });
  } catch (error) {
    console.error("Get chat rooms error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
