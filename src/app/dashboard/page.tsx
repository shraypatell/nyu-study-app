import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getNyDateStart } from "@/lib/date";
import DashboardClient from "@/components/dashboard/DashboardClient";

async function getDashboardData(userId: string) {
  const today = getNyDateStart();

  const userLocation = await prisma.userLocation.findUnique({
    where: { userId },
    include: {
      location: {
        include: {
          parent: true,
        },
      },
    },
  });

  let locationLeaderboard: Array<{
    rank: number;
    userId: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    totalSeconds: number;
    isActive: boolean;
    session: {
      startedAt: string;
      endedAt: string | null;
    } | null;
    location: {
      id: string;
      name: string;
      slug: string;
      parent: {
        id: string;
        name: string;
        slug: string;
      } | null;
    } | null;
  }> = [];

  if (userLocation) {
    const locationUsers = await prisma.userLocation.findMany({
      where: {
        locationId: userLocation.locationId,
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            studySessions: {
              take: 1,
              orderBy: { startedAt: "desc" },
              select: {
                isActive: true,
                startedAt: true,
                endedAt: true,
              },
            },
          },
        },
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

    const currentUserData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        studySessions: {
          take: 1,
          orderBy: { startedAt: "desc" },
          select: {
            isActive: true,
            startedAt: true,
            endedAt: true,
          },
        },
      },
    });

    const currentUserDailyStat = await prisma.dailyStat.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      select: { totalSeconds: true },
    });

    const unsortedLeaderboard = await Promise.all(
      locationUsers.map(async (ul) => {
        const entryUserId = ul.user.id;
        
        const isCurrentUser = entryUserId === userId;
        const user = isCurrentUser && currentUserData ? currentUserData : ul.user;
        
        const dailyStat = isCurrentUser 
          ? currentUserDailyStat 
          : await prisma.dailyStat.findUnique({
              where: {
                userId_date: {
                  userId: entryUserId,
                  date: today,
                },
              },
              select: { totalSeconds: true },
            });

        const session = user.studySessions[0];
        const baseSeconds = dailyStat?.totalSeconds || 0;
        const isActive = session?.isActive || false;
        const liveSessionSeconds = isActive && session
          ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
          : 0;
        const totalLiveSeconds = baseSeconds + liveSessionSeconds;

        return {
          rank: 0,
          userId: entryUserId,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          totalSeconds: baseSeconds,
          totalLiveSeconds,
          isActive,
          session: session
            ? {
                startedAt: session.startedAt.toISOString(),
                endedAt: session.endedAt?.toISOString() || null,
              }
            : null,
          location: ul.location
            ? {
                id: ul.location.id,
                name: ul.location.name,
                slug: ul.location.slug,
                parent: ul.location.parent,
              }
            : null,
        };
      })
    );

    unsortedLeaderboard.sort((a, b) => b.totalLiveSeconds - a.totalLiveSeconds);
    locationLeaderboard = unsortedLeaderboard.slice(0, 20).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  const schoolUsers = await prisma.user.findMany({
    take: 20,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      studySessions: {
        take: 1,
        orderBy: { startedAt: "desc" },
        select: {
          isActive: true,
          startedAt: true,
          endedAt: true,
        },
      },
      userLocations: {
        take: 1,
        select: {
          location: {
            select: {
              id: true,
              name: true,
              slug: true,
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
      },
      dailyStats: {
        where: { date: today },
        take: 1,
        select: {
          totalSeconds: true,
          isPublic: true,
        },
      },
    },
  });

  const schoolLeaderboardWithLiveTime = schoolUsers.map((user) => {
    const dailyStat = user.dailyStats[0];
    const baseSeconds = dailyStat?.isPublic ? dailyStat.totalSeconds : 0;
    const session = user.studySessions[0];
    const isActive = session?.isActive || false;
    const liveSessionSeconds = isActive && session
      ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
      : 0;
    const totalLiveSeconds = baseSeconds + liveSessionSeconds;
    const userLocation = user.userLocations[0]?.location;

    return {
      rank: 0,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      totalSeconds: baseSeconds,
      totalLiveSeconds,
      isActive,
      session: session
        ? {
            startedAt: session.startedAt.toISOString(),
            endedAt: session.endedAt?.toISOString() || null,
          }
        : null,
      location: userLocation
        ? {
            id: userLocation.id,
            name: userLocation.name,
            slug: userLocation.slug,
            parent: userLocation.parent,
          }
        : null,
    };
  });

  schoolLeaderboardWithLiveTime.sort((a, b) => b.totalLiveSeconds - a.totalLiveSeconds);
  const schoolLeaderboard = schoolLeaderboardWithLiveTime.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, status: "ACCEPTED" },
        { addresseeId: userId, status: "ACCEPTED" },
      ],
    },
    take: 20,
    orderBy: { updatedAt: "desc" },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isTimerPublic: true,
          isLocationPublic: true,
          studySessions: {
            take: 1,
            orderBy: { startedAt: "desc" },
            select: {
              isActive: true,
              startedAt: true,
              endedAt: true,
            },
          },
          userLocations: {
            take: 1,
            select: {
              location: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
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
          },
        },
      },
      addressee: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isTimerPublic: true,
          isLocationPublic: true,
          studySessions: {
            take: 1,
            orderBy: { startedAt: "desc" },
            select: {
              isActive: true,
              startedAt: true,
              endedAt: true,
            },
          },
          userLocations: {
            take: 1,
            select: {
              location: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
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
          },
        },
      },
    },
  });

  const friendsWithStats = await Promise.all(
    friendships.map(async (f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;

      const dailyStat = await prisma.dailyStat.findUnique({
        where: {
          userId_date: {
            userId: friend.id,
            date: today,
          },
        },
        select: { totalSeconds: true, isPublic: true },
      });

      const session = friend.studySessions[0];
      const location = friend.isLocationPublic
        ? friend.userLocations[0]?.location || null
        : null;

      return {
        rank: 0,
        id: friend.id,
        username: friend.username,
        displayName: friend.displayName,
        avatarUrl: friend.avatarUrl,
        isTimerPublic: friend.isTimerPublic,
        totalSeconds: dailyStat?.isPublic ? dailyStat.totalSeconds : 0,
        isActive: session?.isActive || false,
        session: session
          ? {
              startedAt: session.startedAt.toISOString(),
              endedAt: session.endedAt?.toISOString() || null,
            }
          : null,
        location: location
          ? {
              id: location.id,
              name: location.name,
              slug: location.slug,
              parent: location.parent,
            }
          : null,
      };
    })
  );

  friendsWithStats.sort((a, b) => b.totalSeconds - a.totalSeconds);
  const rankedFriends = friendsWithStats.map((friend, index) => ({
    ...friend,
    rank: index + 1,
  }));

  const currentUserDailyStat = await prisma.dailyStat.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    select: { totalSeconds: true },
  });

  const currentUserSession = await prisma.studySession.findFirst({
    where: {
      userId,
      isActive: true,
    },
    select: { startedAt: true },
  });

  const baseTotalSeconds = currentUserDailyStat?.totalSeconds || 0;
  const liveSessionSeconds = currentUserSession
    ? Math.floor((Date.now() - currentUserSession.startedAt.getTime()) / 1000)
    : 0;
  const userTotalSeconds = baseTotalSeconds + liveSessionSeconds;

  return {
    locationName: userLocation?.location
      ? userLocation.location.parent
        ? `${userLocation.location.name} in ${userLocation.location.parent.name}`
        : userLocation.location.name
      : null,
    locationId: userLocation?.locationId || null,
    locationLeaderboard,
    schoolLeaderboard,
    friends: rankedFriends,
    userTotalSeconds,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData(user.id);

  return (
    <DashboardClient 
      userId={user.id} 
      initialData={{
        locationName: data.locationName,
        locationId: data.locationId,
        locationLeaderboard: data.locationLeaderboard,
        schoolLeaderboard: data.schoolLeaderboard,
        friends: data.friends,
        userTotalSeconds: data.userTotalSeconds,
      }} 
    />
  );
}
