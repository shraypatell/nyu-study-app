import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import LocationSelector from "@/components/location/LocationSelector";
import TimerContainer from "@/components/timer/TimerContainer";
import { Trophy, MapPin, Users } from "lucide-react";

async function getDashboardData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
    userId: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    totalSeconds: number;
    isActive: boolean;
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
              },
            },
          },
        },
      },
    });

    locationLeaderboard = await Promise.all(
      locationUsers.map(async (ul: { userId: string; user: { id: string; username: string; displayName: string | null; avatarUrl: string | null; studySessions: Array<{ isActive: boolean; startedAt: Date }> } }) => {
        const dailyStat = await prisma.dailyStat.findUnique({
          where: {
            userId_date: {
              userId: ul.userId,
              date: today,
            },
          },
          select: { totalSeconds: true },
        });

        return {
          userId: ul.user.id,
          username: ul.user.username,
          displayName: ul.user.displayName,
          avatarUrl: ul.user.avatarUrl,
          totalSeconds: dailyStat?.totalSeconds || 0,
          isActive: ul.user.studySessions[0]?.isActive || false,
        };
      })
    );

    locationLeaderboard.sort((a: { totalSeconds: number }, b: { totalSeconds: number }) => b.totalSeconds - a.totalSeconds);
  }

  const schoolLeaderboard = await prisma.dailyStat.findMany({
    where: {
      date: today,
      isPublic: true,
      totalSeconds: { gt: 0 },
    },
    take: 20,
    orderBy: { totalSeconds: "desc" },
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
            },
          },
        },
      },
    },
  });

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
      addressee: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isTimerPublic: true,
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
    },
  });

  const friends = friendships.map((f: { requesterId: string; requester: { id: string; username: string; displayName: string | null; avatarUrl: string | null; isTimerPublic: boolean; studySessions: Array<{ isActive: boolean; startedAt: Date; endedAt: Date | null }> }; addressee: { id: string; username: string; displayName: string | null; avatarUrl: string | null; isTimerPublic: boolean; studySessions: Array<{ isActive: boolean; startedAt: Date; endedAt: Date | null }> } }) => {
    const friend = f.requesterId === userId ? f.addressee : f.requester;
    return {
      id: friend.id,
      username: friend.username,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
      isActive: friend.studySessions[0]?.isActive || false,
      isTimerPublic: friend.isTimerPublic,
    };
  });

  return {
    locationName: userLocation?.location ? 
      (userLocation.location.parent ? 
        `${userLocation.location.name} in ${userLocation.location.parent.name}` : 
        userLocation.location.name) : 
      null,
    locationId: userLocation?.locationId || null,
    locationLeaderboard,
    schoolLeaderboard: schoolLeaderboard.map((entry: { user: { id: string; username: string; displayName: string | null; avatarUrl: string | null; studySessions: Array<{ isActive: boolean; startedAt: Date }> }; totalSeconds: number }, index: number) => ({
      rank: index + 1,
      userId: entry.user.id,
      username: entry.user.username,
      displayName: entry.user.displayName,
      avatarUrl: entry.user.avatarUrl,
      totalSeconds: entry.totalSeconds,
      isActive: entry.user.studySessions[0]?.isActive || false,
    })),
    friends,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData(user.id);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Study Timer</h1>
          <p className="text-gray-600 mt-2">Track your study sessions and compete on leaderboards</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          <TimerContainer userId={user.id} />
          <LocationSelector />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-700">
                {data.locationName || "Location Leaderboard"}
              </h3>
            </div>
            {data.locationLeaderboard.length > 0 ? (
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                {data.locationLeaderboard.map((entry: { userId: string; username: string; displayName: string | null; avatarUrl: string | null; totalSeconds: number; isActive: boolean }, index: number) => (
                  <div key={entry.userId} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-center font-medium text-gray-500">{index + 1}</span>
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs text-purple-700">
                      {entry.displayName?.charAt(0) || entry.username.charAt(0)}
                    </div>
                    <span className="flex-1 truncate">{entry.displayName || entry.username}</span>
                    {entry.isActive && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                    <span className="text-gray-500">{formatTime(entry.totalSeconds)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No one studying here yet</p>
            )}
          </div>

          <Link href="/leaderboard">
            <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-700">School Leaderboard</h3>
              </div>
              {data.schoolLeaderboard.length > 0 ? (
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {data.schoolLeaderboard.map((entry: { rank: number; userId: string; username: string; displayName: string | null; avatarUrl: string | null; totalSeconds: number; isActive: boolean }) => (
                    <div key={entry.userId} className="flex items-center gap-2 text-sm">
                      <span className={`w-5 text-center font-medium ${
                        entry.rank === 1 ? "text-yellow-600" :
                        entry.rank === 2 ? "text-gray-500" :
                        entry.rank === 3 ? "text-orange-600" :
                        "text-gray-400"
                      }`}>{entry.rank}</span>
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-700">
                        {entry.displayName?.charAt(0) || entry.username.charAt(0)}
                      </div>
                      <span className="flex-1 truncate">{entry.displayName || entry.username}</span>
                      {entry.isActive && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                      <span className="text-gray-500">{formatTime(entry.totalSeconds)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No study data yet today</p>
              )}
            </div>
          </Link>

          <Link href="/friends">
            <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-700">Friends</h3>
              </div>
              {data.friends.length > 0 ? (
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {data.friends.map((friend: { id: string; username: string; displayName: string | null; avatarUrl: string | null; isActive: boolean; isTimerPublic: boolean }) => (
                    <div key={friend.id} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700">
                        {friend.displayName?.charAt(0) || friend.username.charAt(0)}
                      </div>
                      <span className="flex-1 truncate">{friend.displayName || friend.username}</span>
                      {friend.isTimerPublic && friend.isActive && (
                        <span className="w-2 h-2 bg-green-500 rounded-full" title="Studying now" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No friends yet</p>
              )}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
