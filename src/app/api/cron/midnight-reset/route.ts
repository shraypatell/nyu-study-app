import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const activeSessions = await prisma.studySession.findMany({
      where: {
        isActive: true,
      },
    });

    if (activeSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active sessions to finalize",
        finalizedCount: 0,
      });
    }

    const operations = [];

    for (const session of activeSessions) {
      const durationSeconds = Math.floor(
        (now.getTime() - session.startedAt.getTime()) / 1000
      );

      operations.push(
        prisma.studySession.update({
          where: { id: session.id },
          data: {
            endedAt: now,
            durationSeconds,
            isActive: false,
          },
        })
      );

      operations.push(
        prisma.dailyStat.upsert({
          where: {
            userId_date: {
              userId: session.userId,
              date: yesterday,
            },
          },
          update: {
            totalSeconds: {
              increment: durationSeconds,
            },
          },
          create: {
            userId: session.userId,
            date: yesterday,
            totalSeconds: durationSeconds,
          },
        })
      );
    }

    await prisma.$transaction(operations);

    console.log(`[Midnight Reset] Finalized ${activeSessions.length} sessions at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Finalized ${activeSessions.length} active sessions`,
      finalizedCount: activeSessions.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Midnight reset error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
