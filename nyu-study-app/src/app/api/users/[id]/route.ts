import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userClasses: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                code: true,
                section: true,
                semester: true,
              },
            },
          },
        },
        userLocations: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        studySessions: {
          where: {
            isActive: true,
          },
          orderBy: {
            startedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isOwnProfile = currentUser?.id === user.id;

    const response: {
      id: string;
      username: string;
      displayName: string | null;
      bio: string | null;
      avatarUrl: string | null;
      createdAt: Date;
      timer?: {
        isActive: boolean;
        startedAt: Date | null;
        currentDuration: number;
      } | null;
      classes?: Array<{
        id: string;
        name: string;
        code: string;
        section: string | null;
        semester: string;
      }> | null;
      location?: {
        id: string;
        name: string;
        slug: string;
      } | null;
    } = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    if (isOwnProfile || user.isTimerPublic) {
      const activeSession = user.studySessions[0];
      if (activeSession) {
        const now = new Date();
        const currentDuration = Math.floor(
          (now.getTime() - activeSession.startedAt.getTime()) / 1000
        );
        response.timer = {
          isActive: true,
          startedAt: activeSession.startedAt,
          currentDuration,
        };
      } else {
        response.timer = null;
      }
    }

    if (isOwnProfile || user.isClassesPublic) {
      response.classes = user.userClasses.map((uc: {
        class: {
          id: string;
          name: string;
          code: string;
          section: string | null;
          semester: string;
        };
      }) => ({
        id: uc.class.id,
        name: uc.class.name,
        code: uc.class.code,
        section: uc.class.section,
        semester: uc.class.semester,
      }));
    }

    if (isOwnProfile || user.isLocationPublic) {
      const userLocation = user.userLocations[0];
      if (userLocation) {
        response.location = {
          id: userLocation.location.id,
          name: userLocation.location.name,
          slug: userLocation.location.slug,
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get public profile error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
