import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
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

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait 1 second." },
        { status: 429 }
      );
    }

    let classId: string | null = null;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    try {
      const body = await request.json();
      const requestedClassId = body.classId || null;
      classId = typeof requestedClassId === "string" && uuidPattern.test(requestedClassId)
        ? requestedClassId
        : null;
    } catch {
    }

    if (classId) {
      const hasClass = await prisma.userClass.findUnique({
        where: {
          userId_classId: {
            userId: user.id,
            classId,
          },
        },
        select: { id: true },
      });
      if (!hasClass) {
        classId = null;
      }
    }

    const existingSession = await prisma.studySession.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "Timer is already running", sessionId: existingSession.id },
        { status: 400 }
      );
    }

    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        classId,
        startedAt: new Date(),
        isActive: true,
        createdDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      startedAt: session.startedAt,
      classId: session.classId,
    });
  } catch (error) {
    console.error("Start timer error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
