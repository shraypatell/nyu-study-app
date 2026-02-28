import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { getNyDateStart } from "@/lib/date";
import { NextResponse } from "next/server";

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
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait 1 second." },
        { status: 429 }
      );
    }

    let mode: string = "CLASSIC";
    try {
      const body = await request.json();
      mode = (body.mode === "FOCUS" || body.mode === "CLASSIC") ? body.mode : "CLASSIC";
    } catch {
    }

    // Find active session for this specific mode
    const activeSession = await prisma.studySession.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        mode: mode,
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: "No active timer to pause" },
        { status: 400 }
      );
    }

    // Calculate duration
    const now = new Date();
    const durationSeconds = Math.floor(
      (now.getTime() - activeSession.startedAt.getTime()) / 1000
    );

    // Update session
    await prisma.studySession.update({
      where: { id: activeSession.id },
      data: {
        endedAt: now,
        durationSeconds,
        isActive: false,
      },
    });

    // Update daily stats
    const today = getNyDateStart();

    await prisma.dailyStat.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        totalSeconds: {
          increment: durationSeconds,
        },
      },
      create: {
        userId: user.id,
        date: today,
        totalSeconds: durationSeconds,
      },
    });

    return NextResponse.json({
      success: true,
      totalDuration: durationSeconds,
      sessionDuration: durationSeconds,
    });
  } catch (error) {
    console.error("Pause timer error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
