"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLeaderboardContent from "@/components/dashboard/DashboardLeaderboardContent";
import DashboardFriendsContent from "@/components/dashboard/DashboardFriendsContent";
import DashboardGlassCard from "@/components/dashboard/DashboardGlassCard";

interface LeaderboardEntry {
  rank?: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalSeconds: number;
  isActive: boolean;
  session?: {
    startedAt: string;
    endedAt: string | null;
  } | null;
  location?: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
}

interface FriendItem {
  rank: number;
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isTimerPublic: boolean;
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
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
}

interface DashboardLiveWidgetsProps {
  initialLocationName: string | null;
  initialLocationId: string | null;
  initialLocationLeaderboard: LeaderboardEntry[];
  initialSchoolLeaderboard: LeaderboardEntry[];
  initialFriends: FriendItem[];
}

const POLL_INTERVAL = 10000;

export default function DashboardLiveWidgets({
  initialLocationName,
  initialLocationId,
  initialLocationLeaderboard,
  initialSchoolLeaderboard,
  initialFriends,
}: DashboardLiveWidgetsProps) {
  const [locationId, setLocationId] = useState<string | null>(initialLocationId);
  const [locationName, setLocationName] = useState<string | null>(initialLocationName);
  const [locationLeaderboard, setLocationLeaderboard] = useState<LeaderboardEntry[]>(
    initialLocationLeaderboard
  );
  const [schoolLeaderboard, setSchoolLeaderboard] = useState<LeaderboardEntry[]>(
    initialSchoolLeaderboard
  );
  const [friends, setFriends] = useState<FriendItem[]>(initialFriends);

  const locationTitle = useMemo(() => {
    if (!locationName) return "Location";
    if (locationName.includes(" in ")) {
      const [child, parent] = locationName.split(" in ");
      return `${parent} - ${child}`;
    }
    return locationName;
  }, [locationName]);

  const fetchLocation = async () => {
    try {
      const response = await fetch("/api/user/location", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const loc = data.location;
      const nextLocationId = loc?.id ?? null;
      const nextName = loc?.parent ? `${loc.name} in ${loc.parent.name}` : loc?.name ?? null;

      setLocationName(nextName);
      if (nextLocationId !== locationId) {
        setLocationId(nextLocationId);
        if (nextLocationId) {
          await fetchLocationLeaderboard(nextLocationId);
        }
      }
    } catch (error) {
      console.error("Failed to refresh location:", error);
    }
  };

  const fetchLocationLeaderboard = async (id: string) => {
    try {
      const response = await fetch(`/api/leaderboards/location/${id}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const mapped = (data.leaderboard || []).map((entry: any) => ({
        ...entry,
        isActive: entry.isActiveNow ?? entry.session?.isActive ?? false,
      }));
      setLocationLeaderboard(mapped);
    } catch (error) {
      console.error("Failed to refresh location leaderboard:", error);
    }
  };

  const fetchSchoolLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboards/school", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const mapped = (data.leaderboard || []).map((entry: any) => ({
        ...entry,
        isActive: entry.session?.isActive ?? false,
      }));
      setSchoolLeaderboard(mapped);
    } catch (error) {
      console.error("Failed to refresh school leaderboard:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch("/api/friends", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const mapped = (data.friends || []).map((entry: any, index: number) => ({
        rank: index + 1,
        id: entry.user.id,
        username: entry.user.username,
        displayName: entry.user.displayName,
        avatarUrl: entry.user.avatarUrl,
        isTimerPublic: entry.user.isTimerPublic,
        totalSeconds: entry.user.totalSeconds,
        isActive: entry.user.session?.isActive ?? false,
        session: entry.user.session,
        location: entry.user.location,
      }));
      setFriends(mapped);
    } catch (error) {
      console.error("Failed to refresh friends:", error);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const runPoll = () => {
      fetchSchoolLeaderboard();
      fetchFriends();
      fetchLocation();
      if (locationId) {
        fetchLocationLeaderboard(locationId);
      }
    };

    const startPolling = () => {
      if (interval) return;
      runPoll();
      interval = setInterval(runPoll, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [locationId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <DashboardGlassCard
        title={locationTitle ? `${locationTitle} leaderboard` : "location leaderboard"}
        href={locationId ? `/leaderboard/${locationId}` : "/leaderboard"}
      >
        <DashboardLeaderboardContent icon="location" entries={locationLeaderboard} />
      </DashboardGlassCard>

      <DashboardGlassCard
        title="School leaderboard"
        href="/leaderboard"
      >
        <DashboardLeaderboardContent icon="school" entries={schoolLeaderboard} />
      </DashboardGlassCard>

      <DashboardGlassCard title="Friends" href="/friends">
        <DashboardFriendsContent friends={friends} />
      </DashboardGlassCard>
    </div>
  );
}
