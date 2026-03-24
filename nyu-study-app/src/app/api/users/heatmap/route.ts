import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const weeks = Math.min(parseInt(url.searchParams.get("weeks") || "12"), 52);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);
    startDate.setHours(0, 0, 0, 0);

    const dailyStats = await prisma.dailyStat.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        totalSeconds: true,
      },
    });

    return NextResponse.json({
      days: dailyStats.map((d) => ({
        date: d.date.toISOString().slice(0, 10),
        totalSeconds: d.totalSeconds,
      })),
    });
  } catch (error) {
    console.error("Get heatmap error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
