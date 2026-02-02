"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

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

interface DashboardFriendsWidgetProps {
  friends: Friend[];
}

export default function DashboardFriendsWidget({
  friends,
}: DashboardFriendsWidgetProps) {
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
    if (rank === 1) return "text-yellow-600 font-bold";
    if (rank === 2) return "text-gray-500 font-bold";
    if (rank === 3) return "text-orange-600 font-bold";
    return "text-gray-400";
  };

  return (
    <Link href="/friends">
      <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-700">Friends</h3>
        </div>
        {friends.length > 0 ? (
          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-start gap-2 text-sm py-1"
              >
                <span className={`w-5 text-center ${getRankStyle(friend.rank)}`}>
                  {friend.rank}
                </span>
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 shrink-0">
                  {friend.displayName?.charAt(0) || friend.username.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="truncate">
                      {friend.displayName || friend.username}
                    </span>
                    {friend.isTimerPublic && friend.isActive && (
                      <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                    )}
                  </div>
                  {getStatusText(friend) && (
                    <div className="text-xs text-gray-500 truncate">
                      {getStatusText(friend)}
                    </div>
                  )}
                </div>
                <div className="font-mono text-gray-700 shrink-0">
                  {formatTime(getTotalLiveSeconds(friend))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No friends yet</p>
        )}
      </div>
    </Link>
  );
}
