import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getNyDateStart } from "@/lib/date";
import LocationSelector from "@/components/location/LocationSelector";
import TimerContainer from "@/components/timer/TimerContainer";
import ClassSelector from "@/components/timer/ClassSelector";
import DashboardLeaderboardWidget from "@/components/dashboard/DashboardLeaderboardWidget";
import DashboardFriendsWidget from "@/components/dashboard/DashboardFriendsWidget";

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
      take: 20,
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

    const unsortedLeaderboard = await Promise.all(
      locationUsers.map(async (ul) => {
        const dailyStat = await prisma.dailyStat.findUnique({
          where: {
            userId_date: {
              userId: ul.userId,
              date: today,
            },
          },
          select: { totalSeconds: true },
        });

        const session = ul.user.studySessions[0];
        const baseSeconds = dailyStat?.totalSeconds || 0;
        const isActive = session?.isActive || false;
        const liveSessionSeconds = isActive && session
          ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
          : 0;
        const totalLiveSeconds = baseSeconds + liveSessionSeconds;

        return {
          rank: 0,
          userId: ul.user.id,
          username: ul.user.username,
          displayName: ul.user.displayName,
          avatarUrl: ul.user.avatarUrl,
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
    locationLeaderboard = unsortedLeaderboard.map((entry, index) => ({
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Study Timer</h1>
          <p className="text-gray-600 mt-2">
            Track your study sessions and compete on leaderboards
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <ClassSelector />
          <TimerContainer userId={user.id} />
          <LocationSelector />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <DashboardLeaderboardWidget
            title={data.locationName || "Location Leaderboard"}
            icon="location"
            entries={data.locationLeaderboard}
            href={data.locationId ? `/leaderboard/${data.locationId}` : "/leaderboard"}
            isClickable={false}
          />

          <DashboardLeaderboardWidget
            title="School Leaderboard"
            icon="school"
            entries={data.schoolLeaderboard}
            href="/leaderboard"
            isClickable={true}
          />

          <DashboardFriendsWidget friends={data.friends} />
        </div>
      </div>
    </div>
  );
}
