import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;

    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    if (friendship.addresseeId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to respond to this request" },
        { status: 403 }
      );
    }

    if (friendship.status !== "PENDING") {
      return NextResponse.json(
        { error: "Friend request is no longer pending" },
        { status: 400 }
      );
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: { status },
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
    });

    return NextResponse.json({
      success: true,
      friendship: {
        id: updated.id,
        status: updated.status,
        requester: updated.requester,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update friendship error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friendship not found" },
        { status: 404 }
      );
    }

    const isParticipant =
      friendship.requesterId === user.id ||
      friendship.addresseeId === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not authorized to remove this friendship" },
        { status: 403 }
      );
    }

    await prisma.friendship.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Friendship removed",
    });
  } catch (error) {
    console.error("Delete friendship error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
