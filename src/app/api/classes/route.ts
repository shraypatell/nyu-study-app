import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
    const joinedOnly = searchParams.get("joined") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "32", 10)));
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
      ...(semester && { semester }),
      ...(joinedOnly && {
        userClasses: {
          some: { userId: user.id },
        },
      }),
    };

    const [classes, totalCount] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          userClasses: {
            where: { userId: user.id },
            select: { id: true },
          },
          _count: {
            select: { userClasses: true },
          },
          chatRoom: {
            select: { id: true },
          },
        },
        orderBy: [{ semester: "desc" }, { code: "asc" }],
        ...(joinedOnly ? {} : { skip, take: limit }),
      }),
      prisma.class.count({ where }),
    ]);

    const formattedClasses = classes.map((cls: { id: string; name: string; code: string; section: string | null; semester: string; _count: { userClasses: number }; userClasses: Array<{ id: string }>; chatRoom: { id: string } | null }) => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      section: cls.section,
      semester: cls.semester,
      memberCount: cls._count.userClasses,
      isJoined: cls.userClasses.length > 0,
      chatRoomId: cls.chatRoom?.id || null,
    }));

    const totalPages = joinedOnly ? 1 : Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      classes: formattedClasses,
      totalCount,
      page: joinedOnly ? 1 : page,
      limit: joinedOnly ? totalCount : limit,
      totalPages,
    });
  } catch (error) {
    console.error("Get classes error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
