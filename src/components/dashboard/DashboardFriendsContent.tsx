"use client";

import { useState, useEffect } from "react";

interface Friend {
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

interface DashboardFriendsContentProps {
  friends: Friend[];
}

export default function DashboardFriendsContent({
  friends,
}: DashboardFriendsContentProps) {
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

  const getTotalLiveSeconds = (friend: Friend) => {
    let total = friend.totalSeconds;
    if (friend.isTimerPublic && friend.isActive && friend.session) {
      const startedAt = new Date(friend.session.startedAt).getTime();
      const sessionDuration = Math.max(0, Math.floor((now - startedAt) / 1000));
      total += sessionDuration;
    }
    return total;
  };

  const getStatusText = (friend: Friend) => {
    if (!friend.isTimerPublic || !friend.session) return null;
    const startedAt = new Date(friend.session.startedAt).getTime();
    const endedAt = friend.session.endedAt
      ? new Date(friend.session.endedAt).getTime()
      : null;

    if (friend.isActive) {
      const durationSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
      const locationText = friend.location?.name
        ? friend.location.parent
          ? ` at ${friend.location.name} in ${friend.location.parent.name}`
          : ` at ${friend.location.name}`
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

    const locationText = friend.location?.name
      ? friend.location.parent
        ? ` at ${friend.location.name} in ${friend.location.parent.name}`
        : ` at ${friend.location.name}`
      : "";
    return `${elapsedText}${locationText}`;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-black font-bold";
    if (rank === 2) return "text-black font-bold";
    if (rank === 3) return "text-black font-bold";
    return "text-black";
  };

  if (friends.length === 0) {
    return <p className="text-sm text-black">No friends yet</p>;
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
      {friends.map((friend) => (
        <div key={friend.id} className="flex items-start gap-3 text-sm">
          <span className={`w-6 text-center ${getRankStyle(friend.rank)}`}>
            {friend.rank}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {friend.displayName || friend.username}
            </div>
            {getStatusText(friend) && (
              <div
                className={`text-xs truncate ${
                  friend.isTimerPublic && friend.isActive
                    ? "status-active"
                    : "text-black"
                }`}
              >
                {getStatusText(friend)}
              </div>
            )}
          </div>
          <div className="text-sm font-semibold shrink-0">
            {formatTime(getTotalLiveSeconds(friend))}
          </div>
        </div>
      ))}
    </div>
  );
}
