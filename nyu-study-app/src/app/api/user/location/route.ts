import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateLocationSchema = z.object({
  locationId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = updateLocationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { locationId } = validationResult.data;

    const locationExists = await prisma.location.findUnique({
      where: { id: locationId, isActive: true },
      select: { id: true },
    });

    if (!locationExists) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    const userLocation = await prisma.userLocation.upsert({
      where: { userId: user.id },
      update: {
        locationId,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        locationId,
      },
      include: {
        location: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      location: {
        id: userLocation.location.id,
        name: userLocation.location.name,
        slug: userLocation.location.slug,
        parent: userLocation.location.parent,
      },
    });
  } catch (error) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userLocation = await prisma.userLocation.findUnique({
      where: { userId: user.id },
      include: {
        location: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!userLocation) {
      return NextResponse.json({ location: null });
    }

    return NextResponse.json({
      location: {
        id: userLocation.location.id,
        name: userLocation.location.name,
        slug: userLocation.location.slug,
        parent: userLocation.location.parent,
      },
    });
  } catch (error) {
    console.error("Get user location error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
