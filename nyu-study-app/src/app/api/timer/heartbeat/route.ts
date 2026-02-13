import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeSession = await prisma.studySession.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 404 }
      );
    }

    await prisma.studySession.update({
      where: { id: activeSession.id },
      data: {
        lastHeartbeatAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      sessionId: activeSession.id 
    });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
