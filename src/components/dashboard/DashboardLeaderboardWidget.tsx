"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, MapPin } from "lucide-react";

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
}

export default function DashboardLeaderboardWidget({
  title,
  icon,
  entries,
  href,
  isClickable = true,
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
    if (rank === 1) return "text-yellow-600 font-bold";
    if (rank === 2) return "text-gray-500 font-bold";
    if (rank === 3) return "text-orange-600 font-bold";
    return "text-gray-400";
  };

  const content = (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm ${
        isClickable ? "hover:shadow-md transition-shadow cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon === "location" ? (
          <MapPin className="h-5 w-5 text-purple-600" />
        ) : (
          <Trophy className="h-5 w-5 text-yellow-500" />
        )}
        <h3 className="font-semibold text-gray-700">{title}</h3>
      </div>
      {entries.length > 0 ? (
        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className="flex items-start gap-2 text-sm py-1"
            >
              {entry.rank && (
                <span className={`w-5 text-center ${getRankStyle(entry.rank)}`}>
                  {entry.rank}
                </span>
              )}
              {!entry.rank && (
                <span className="w-5 text-center text-gray-500">-</span>
              )}
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-700 shrink-0">
                {entry.displayName?.charAt(0) || entry.username.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate">
                    {entry.displayName || entry.username}
                  </span>
                  {entry.isActive && (
                    <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {getStatusText(entry)}
                </div>
              </div>
              <div className="font-mono text-gray-700 shrink-0">
                {formatTime(getTotalLiveSeconds(entry))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          {icon === "location"
            ? "No one studying here yet"
            : "No study data yet today"}
        </p>
      )}
    </div>
  );

  if (isClickable) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
