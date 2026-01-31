import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const leaveSchema = z.object({
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
    const validationResult = leaveSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { classId } = validationResult.data;

    const userClass = await prisma.userClass.findUnique({
      where: {
        userId_classId: {
          userId: user.id,
          classId,
        },
      },
    });

    if (!userClass) {
      return NextResponse.json(
        { error: "Not a member of this class" },
        { status: 400 }
      );
    }

    await prisma.userClass.delete({
      where: { id: userClass.id },
    });

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { classId },
    });

    if (chatRoom) {
      await prisma.chatRoomUser.deleteMany({
        where: {
          roomId: chatRoom.id,
          userId: user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Left class successfully",
    });
  } catch (error) {
    console.error("Leave class error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
