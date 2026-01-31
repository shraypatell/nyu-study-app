import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const staleSessions = await prisma.studySession.findMany({
      where: {
        isActive: true,
        startedAt: {
          lt: twoMinutesAgo,
        },
      },
    });

    for (const session of staleSessions) {
      const now = new Date();
      const durationSeconds = Math.floor(
        (now.getTime() - session.startedAt.getTime()) / 1000
      );

      await prisma.studySession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          durationSeconds,
          isActive: false,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyStat.upsert({
        where: {
          userId_date: {
            userId: session.userId,
            date: today,
          },
        },
        update: {
          totalSeconds: {
            increment: durationSeconds,
          },
        },
        create: {
          userId: session.userId,
          date: today,
          totalSeconds: durationSeconds,
        },
      });
    }

    return NextResponse.json({
      success: true,
      cleanedUp: staleSessions.length,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
