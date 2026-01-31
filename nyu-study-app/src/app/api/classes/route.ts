import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const semester = searchParams.get("semester");

    const classes = await prisma.class.findMany({
      where: {
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(semester && { semester }),
      },
      include: {
        userClasses: {
          where: { userId: user.id },
          select: { id: true },
        },
        _count: {
          select: { userClasses: true },
        },
      },
      orderBy: [{ semester: "desc" }, { code: "asc" }],
      take: 100,
    });

    const formattedClasses = classes.map((cls: { id: string; name: string; code: string; section: string | null; semester: string; _count: { userClasses: number }; userClasses: Array<{ id: string }> }) => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      section: cls.section,
      semester: cls.semester,
      memberCount: cls._count.userClasses,
      isJoined: cls.userClasses.length > 0,
    }));

    return NextResponse.json({ classes: formattedClasses });
  } catch (error) {
    console.error("Get classes error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
