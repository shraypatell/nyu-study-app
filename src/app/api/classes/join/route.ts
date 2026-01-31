import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const joinSchema = z.object({
  classId: z.string().uuid(),
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
    const validationResult = joinSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { classId } = validationResult.data;

    const classExists = await prisma.class.findUnique({
      where: { id: classId, isActive: true },
      select: { id: true },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const existingMembership = await prisma.userClass.findUnique({
      where: {
        userId_classId: {
          userId: user.id,
          classId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already joined this class" },
        { status: 400 }
      );
    }

    const userClass = await prisma.userClass.create({
      data: {
        userId: user.id,
        classId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            section: true,
            semester: true,
          },
        },
      },
    });

    let chatRoom = await prisma.chatRoom.findUnique({
      where: { classId },
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          type: "CLASS",
          classId,
        },
      });
    }

    await prisma.chatRoomUser.create({
      data: {
        roomId: chatRoom.id,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      class: userClass.class,
    });
  } catch (error) {
    console.error("Join class error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
