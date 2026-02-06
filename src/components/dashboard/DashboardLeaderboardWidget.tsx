"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

interface DashboardLeaderboardWidgetProps {
  title: string;
  icon: "location" | "school";
  entries: LeaderboardEntry[];
  href: string;
  isClickable?: boolean;
  className?: string;
}

export default function DashboardLeaderboardWidget({
  title,
  icon,
  entries,
  href,
  isClickable = true,
  className,
}: DashboardLeaderboardWidgetProps) {
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

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-black font-bold";
    if (rank === 2) return "text-black font-bold";
    if (rank === 3) return "text-black font-bold";
    return "text-black";
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

  const content = (
    <div
      className={cn(
        "aspect-square p-5 flex flex-col gap-3 text-black",
        isClickable ? "cursor-pointer" : "",
        className
      )}
    >
      <div className="relative z-10 h-full flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">
          {title}
        </h3>
        {sortedEntries.length > 0 ? (
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
        ) : (
          <p className="text-sm text-black">
            {icon === "location"
              ? "No one studying here yet"
              : "No study data yet today"}
          </p>
        )}
      </div>
    </div>
  );

  if (isClickable) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
