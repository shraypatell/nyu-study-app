"use client";

import { useState, useEffect, useMemo } from "react";

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

interface DashboardLeaderboardContentProps {
  icon: "location" | "school";
  entries: LeaderboardEntry[];
}

export default function DashboardLeaderboardContent({
  icon,
  entries,
}: DashboardLeaderboardContentProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalLiveSeconds = (entry: LeaderboardEntry) => {
    let total = entry.totalSeconds;
    if (entry.isActive && entry.session) {
      const startedAt = new Date(entry.session.startedAt).getTime();
      const sessionDuration = Math.max(0, Math.floor((now - startedAt) / 1000));
      total += sessionDuration;
    }
    return total;
  };

  const getStatusText = (entry: LeaderboardEntry) => {
    if (!entry.session) return null;
    const startedAt = new Date(entry.session.startedAt).getTime();
    const endedAt = entry.session.endedAt
      ? new Date(entry.session.endedAt).getTime()
      : null;

    if (entry.isActive) {
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

  const sortedEntries = useMemo(() => {
    return [...entries]
      .map((entry) => ({
        ...entry,
        computedLiveSeconds: getTotalLiveSeconds(entry),
      }))
      .sort((a, b) => b.computedLiveSeconds - a.computedLiveSeconds)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [entries, now]);

  if (sortedEntries.length === 0) {
    return (
      <p className="text-sm text-black">
        {icon === "location"
          ? "No one studying here yet"
          : "No study data yet today"}
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
      {sortedEntries.map((entry) => (
        <div key={entry.userId} className="flex items-center gap-3">
          <div className="text-xs font-semibold w-6">#{entry.rank}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">
              {entry.displayName || entry.username}
            </div>
            {getStatusText(entry) && (
              <div
                className={`text-xs truncate ${
                  entry.isActive ? "status-active" : "text-black"
                }`}
              >
                {getStatusText(entry)}
              </div>
            )}
          </div>
          <div className="text-sm font-semibold shrink-0">
            {formatTime(getTotalLiveSeconds(entry))}
          </div>
        </div>
      ))}
    </div>
  );
}
