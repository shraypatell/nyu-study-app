import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  isTimerPublic: z.boolean().optional(),
  isClassesPublic: z.boolean().optional(),
  isLocationPublic: z.boolean().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
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

export async function PUT(request: Request) {
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
        { error: "Rate limit exceeded. Please wait 1 second." },
        { status: 429 }
      );
    }

    const body = await request.json();

    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const updateData: Record<string, unknown> = { ...data };

    if (data.username !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { username: true, usernameChanges: true },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      if (data.username === currentUser.username) {
        delete updateData.username;
      } else {
        if (currentUser.usernameChanges >= 2) {
          return NextResponse.json(
            { error: "You have used all 2 username changes. Username cannot be changed anymore." },
            { status: 400 }
          );
        }

        const existingUser = await prisma.user.findUnique({
          where: { username: data.username },
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "Username is already taken. Please choose a different one." },
            { status: 400 }
          );
        }

        updateData.usernameChanges = currentUser.usernameChanges + 1;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isTimerPublic: true,
        isClassesPublic: true,
        isLocationPublic: true,
        usernameChanges: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isTimerPublic: true,
        isClassesPublic: true,
        isLocationPublic: true,
        usernameChanges: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: dbUser,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
