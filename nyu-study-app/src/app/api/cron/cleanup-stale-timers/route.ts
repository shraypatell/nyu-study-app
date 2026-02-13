import { prisma } from "@/lib/prisma";
import { getNyDateStart } from "@/lib/date";
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

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const staleSessions = await prisma.studySession.findMany({
      where: {
        isActive: true,
        OR: [
          { lastHeartbeatAt: null },
          { lastHeartbeatAt: { lt: twoMinutesAgo } },
        ],
      },
    });

    if (staleSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stale sessions found",
        cleanedUp: 0,
      });
    }

    const operations = [];
    const now = new Date();

    for (const session of staleSessions) {
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

      const today = getNyDateStart();

      operations.push(
        prisma.dailyStat.upsert({
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
        })
      );
    }

    await prisma.$transaction(operations);

    console.log(`[Stale Timer Cleanup] Cleaned up ${staleSessions.length} sessions at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${staleSessions.length} stale sessions`,
      cleanedUp: staleSessions.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Stale timer cleanup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
