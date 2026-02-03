"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Clock, MapPin } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalSeconds: number;
  totalLiveSeconds?: number;
  isTimerPublic?: boolean;
  session?: {
    isActive: boolean;
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
  isCurrentUser: boolean;
  isActiveNow?: boolean;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry | null;
  date: string;
  hasMore: boolean;
  nextCursor: string | null;
  location?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface LeaderboardTableProps {
  locationId?: string;
}

export default function LeaderboardTable({ locationId }: LeaderboardTableProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetchLeaderboard();
  }, [locationId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [locationId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = locationId
        ? `/api/leaderboards/location/${locationId}`
        : "/api/leaderboards/school";
      const response = await fetch(url);
      if (response.ok) {
        const newData = await response.json();
        setData(newData);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!data?.nextCursor) return;
    setLoadingMore(true);
    try {
      const url = new URL(
        locationId
          ? `/api/leaderboards/location/${locationId}`
          : "/api/leaderboards/school",
        window.location.origin
      );
      url.searchParams.set("cursor", data.nextCursor);

      const response = await fetch(url.toString());
      if (response.ok) {
        const newData = await response.json();
        setData((prev) =>
          prev
            ? {
                ...newData,
                leaderboard: [...prev.leaderboard, ...newData.leaderboard],
              }
            : newData
        );
      }
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = (entry: LeaderboardEntry) => {
    if (!entry.isTimerPublic || !entry.session) return null;
    const startedAt = new Date(entry.session.startedAt).getTime();
    const endedAt = entry.session.endedAt ? new Date(entry.session.endedAt).getTime() : null;

    if (entry.session.isActive) {
      const durationSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
      const locationText = entry.location?.name
        ? entry.location.parent
          ? ` at ${entry.location.name} in ${entry.location.parent.name}`
          : ` at ${entry.location.name}`
        : "";
      return `Studying ${formatTime(durationSeconds)}${locationText}`;
    }

    const endTime = endedAt ?? startedAt;
    const elapsedMinutes = Math.max(0, Math.floor((now - endTime) / 60000));
    const days = Math.floor(elapsedMinutes / 1440);
    const hours = Math.floor((elapsedMinutes % 1440) / 60);
    const minutes = elapsedMinutes % 60;
    let elapsedText = "";

    if (days > 0) {
      elapsedText = `Active ${days}d ${hours}h ago`;
    } else if (hours > 0) {
      elapsedText = `Active ${hours}h ${minutes}m ago`;
    } else {
      elapsedText = `Active ${minutes}m ago`;
    }

    const locationText = entry.location?.name
      ? entry.location.parent
        ? ` at ${entry.location.name} in ${entry.location.parent.name}`
        : ` at ${entry.location.name}`
      : "";
    return `${elapsedText}${locationText}`;

  };

  const getTotalLiveSeconds = (entry: LeaderboardEntry) => {
    let total = entry.totalSeconds;
    if (entry.isTimerPublic && entry.session?.isActive) {
      const startedAt = new Date(entry.session.startedAt).getTime();
      const sessionDuration = Math.max(0, Math.floor((now - startedAt) / 1000));
      total += sessionDuration;
    }
    return total;
  };

  const getSessionDuration = (entry: LeaderboardEntry) => {
    if (!entry.isTimerPublic || !entry.session?.isActive) return 0;
    const startedAt = new Date(entry.session.startedAt).getTime();
    return Math.max(0, Math.floor((now - startedAt) / 1000));
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-300";
    if (rank === 3) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-gray-50 text-gray-600";
  };

  const sortedLeaderboard = useMemo(() => {
    if (!data?.leaderboard) return [];
    
    return [...data.leaderboard]
      .map((entry) => ({
        ...entry,
        computedLiveSeconds: getTotalLiveSeconds(entry),
      }))
      .sort((a, b) => b.computedLiveSeconds - a.computedLiveSeconds)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [data?.leaderboard, now]);

  const sortedCurrentUserEntry = useMemo(() => {
    if (!data?.currentUserEntry) return null;
    const idx = sortedLeaderboard.findIndex((e) => e.isCurrentUser);
    if (idx >= 0) {
      return { ...sortedLeaderboard[idx], rank: idx + 1 };
    }
    const liveSeconds = getTotalLiveSeconds(data.currentUserEntry);
    let rank = sortedLeaderboard.length + 1;
    for (let i = 0; i < sortedLeaderboard.length; i++) {
      if (liveSeconds > sortedLeaderboard[i].computedLiveSeconds) {
        rank = i + 1;
        break;
      }
    }
    return { ...data.currentUserEntry, rank, computedLiveSeconds: liveSeconds };
  }, [data?.currentUserEntry, sortedLeaderboard, now]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No study data yet today</p>
          <p className="text-sm mt-2">Be the first to start studying!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.location && (
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <MapPin className="h-5 w-5" />
          <span className="font-medium">{data.location.name}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {locationId ? "Location Leaderboard" : "School Leaderboard"}
            </span>
            <span className="text-sm font-normal text-gray-500">
              {data.date}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedLeaderboard.map((entry) => (
              <Link key={entry.userId} href={`/users/${entry.userId}`}>
                <div
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                    entry.isCurrentUser ? "bg-purple-50 border border-purple-200" : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${getRankStyle(
                      entry.rank
                    )}`}
                  >
                    {entry.rank}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatarUrl || undefined} />
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {entry.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {entry.displayName || entry.username}
                      </span>
                      {entry.isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                      {entry.session?.isActive && entry.isTimerPublic && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-700"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Studying
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">@{entry.username}</div>
                    {getStatusText(entry) && (
                      <div className="text-xs text-gray-600">
                        {getStatusText(entry)}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-semibold">
                      {formatTime(getTotalLiveSeconds(entry))}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {sortedCurrentUserEntry &&
            !sortedLeaderboard.some((e) => e.isCurrentUser) && (
              <>
                <div className="my-4 border-t border-dashed" />
                <div className="flex items-center gap-4 p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${getRankStyle(
                      sortedCurrentUserEntry.rank
                    )}`}
                  >
                    {sortedCurrentUserEntry.rank}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={sortedCurrentUserEntry.avatarUrl || undefined} />
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {sortedCurrentUserEntry.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {sortedCurrentUserEntry.displayName ||
                          sortedCurrentUserEntry.username}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      @{sortedCurrentUserEntry.username}
                    </div>
                    {getStatusText(sortedCurrentUserEntry) && (
                      <div className="text-xs text-gray-600">
                        {getStatusText(sortedCurrentUserEntry)}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-semibold">
                      {formatTime(getTotalLiveSeconds(sortedCurrentUserEntry))}
                    </p>
                  </div>
                </div>
              </>
            )}

          {data.hasMore && (
            <div className="mt-4 text-center">
              <Button
                onClick={loadMore}
                variant="outline"
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
