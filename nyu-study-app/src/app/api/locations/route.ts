import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    const formattedLocations = locations.map((location: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      parent: {
        id: string;
        name: string;
        slug: string;
      } | null;
      children: Array<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
      }>;
    }) => ({
      id: location.id,
      name: location.name,
      slug: location.slug,
      description: location.description,
      parent: location.parent,
      children: location.children,
      isParent: location.children.length > 0,
    }));

    return NextResponse.json({ locations: formattedLocations });
  } catch (error) {
    console.error("Get locations error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
