"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PillNav from "@/components/PillNav";
import { Loader2, MessageCircle, UserX, Search, UserCheck } from "lucide-react";
import Link from "next/link";

interface Friend {
  friendshipId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isTimerPublic: boolean;
    totalSeconds: number;
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
    session?: {
      isActive: boolean;
      startedAt: string;
      endedAt: string | null;
    } | null;
  };
  since: string;
}

interface FriendRequest {
  id: string;
  requester?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  addressee?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState("friends");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests?type=received"),
        fetch("/api/friends/requests?type=sent"),
      ]);

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(friendsData.friends);
      }

      if (receivedRes.ok) {
        const receivedData = await receivedRes.json();
        setReceivedRequests(receivedData.requests);
      }

      if (sentRes.ok) {
        const sentData = await sentRes.json();
        setSentRequests(sentData.sent);
      }
    } catch (error) {
      console.error("Failed to fetch friends data:", error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    setProcessingRequest(requestId);
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setReceivedRequests((prev) => prev.filter((r: FriendRequest) => r.id !== requestId));
        if (status === "ACCEPTED") {
          await fetchData();
        }
      }
    } catch (error) {
      console.error("Failed to respond to request:", error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFriends((prev) => prev.filter((f: Friend) => f.friendshipId !== friendshipId));
      }
    } catch (error) {
      console.error("Failed to remove friend:", error);
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSentRequests((prev) => prev.filter((r: FriendRequest) => r.id !== requestId));
      }
    } catch (error) {
      console.error("Failed to cancel request:", error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await cancelRequest(requestId);
    } finally {
      setProcessingRequest(null);
    }
  };

  const startChat = async (userId: string) => {
    setStartingChat(userId);
    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DM", userId }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/chat/room/${data.room.id}`;
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setStartingChat(null);
    }
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.user.displayName &&
        friend.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  const getTotalLiveSeconds = (friend: Friend) => {
    let total = friend.user.totalSeconds;
    if (friend.user.isTimerPublic && friend.user.session?.isActive) {
      const startedAt = new Date(friend.user.session.startedAt).getTime();
      const sessionDuration = Math.max(0, Math.floor((now - startedAt) / 1000));
      total += sessionDuration;
    }
    return total;
  };

  const getStatusText = (friend: Friend) => {
    if (!friend.user.isTimerPublic || !friend.user.session) return null;
    const startedAt = new Date(friend.user.session.startedAt).getTime();
    const endedAt = friend.user.session.endedAt
      ? new Date(friend.user.session.endedAt).getTime()
      : null;

    if (friend.user.session.isActive) {
      const durationSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
      const locationText = friend.user.location?.name
        ? friend.user.location.parent
          ? ` at ${friend.user.location.name} in ${friend.user.location.parent.name}`
          : ` at ${friend.user.location.name}`
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

    const locationText = friend.user.location?.name
      ? friend.user.location.parent
        ? ` at ${friend.user.location.name} in ${friend.user.location.parent.name}`
        : ` at ${friend.user.location.name}`
      : "";
    return `${elapsedText}${locationText}`;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-600 font-bold";
    if (rank === 2) return "text-gray-500 font-bold";
    if (rank === 3) return "text-orange-600 font-bold";
    return "text-gray-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="glass-panel rounded-3xl px-6 py-6 mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Friends</h1>
        <p className="text-muted-foreground">Manage requests and stay in sync with your study circle.</p>
      </div>

      <PillNav
        items={[
          {
            label: "Friends",
            value: "friends",
            badge: friends.length > 0 ? (
              <Badge variant="secondary" className="ml-2">
                {friends.length}
              </Badge>
            ) : undefined
          },
          {
            label: "Requests",
            value: "received",
            badge: receivedRequests.length > 0 ? (
              <Badge variant="destructive" className="ml-2">
                {receivedRequests.length}
              </Badge>
            ) : undefined
          },
          { label: "Sent", value: "sent" },
          { label: "Search", value: "search", icon: <Search className="h-4 w-4" /> }
        ]}
        activeValue={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === "friends" && (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10"
            />
          </div>

          {filteredFriends.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">
                {searchQuery ? "No friends match your search" : "No friends yet"}
              </p>
              {!searchQuery && (
                <p className="text-sm mt-2">
                  Use the search page to find and add friends
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFriends.map((friend, index) => (
                <Card key={friend.friendshipId} className="glass-card">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-8 text-center text-sm font-medium ${getRankStyle(index + 1)}`}>
                      {index + 1}
                    </div>

                    <Avatar className="h-12 w-12">
                      <AvatarImage src={friend.user.avatarUrl || undefined} />
                    <AvatarFallback className="glass-chip text-foreground">
                      {friend.user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {friend.user.displayName || friend.user.username}
                        </h3>
                        {friend.user.session?.isActive && friend.user.isTimerPublic && (
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{friend.user.username}
                      </p>
                      {getStatusText(friend) && (
                        <p className="text-xs text-muted-foreground">
                          {getStatusText(friend)}
                        </p>
                      )}
                    </div>

                    <div className="font-mono text-foreground text-right">
                      {formatTime(getTotalLiveSeconds(friend))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startChat(friend.user.id)}
                        disabled={startingChat === friend.user.id}
                      >
                        {startingChat === friend.user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFriend(friend.friendshipId)}
                      >
                        <UserX className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "received" && (
        <>
          {receivedRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No pending friend requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedRequests.map((request) => (
                <Card key={request.id} className="glass-card">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.requester?.avatarUrl || undefined} />
                      <AvatarFallback className="glass-chip text-foreground">
                        {request.requester?.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {request.requester?.displayName || request.requester?.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{request.requester?.username}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => respondToRequest(request.id, "ACCEPTED")}
                        disabled={processingRequest === request.id}
                        size="sm"
                      >
                        {processingRequest === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Accept"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => respondToRequest(request.id, "REJECTED")}
                        disabled={processingRequest === request.id}
                        size="sm"
                      >
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "sent" && (
        <>
          {sentRequests.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No sent requests</p>
                <p className="text-sm mt-2">Friend requests you send will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <Card key={request.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.addressee?.avatarUrl || undefined} />
                        <AvatarFallback className="glass-chip text-foreground">
                          {request.addressee?.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {request.addressee?.displayName || request.addressee?.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">@{request.addressee?.username}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sent {formatTimeAgo(request.createdAt)}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processingRequest === request.id}
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        {processingRequest === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Cancel"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "search" && <UserSearchTab />}
    </div>
  );
}

function UserSearchTab() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isTimerPublic: boolean;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.length < 2) {
        setUsers([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
          setHasSearched(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search students by username or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {!hasSearched && query.length < 2 && (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Type at least 2 characters to search</p>
            <p className="text-sm mt-2">Find students to add as friends</p>
          </CardContent>
        </Card>
      )}

      {hasSearched && users.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg">No students found</p>
            <p className="text-sm mt-2">Try a different search term</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <Link key={user.id} href={`/users/${user.id}`}>
            <Card className="glass-card cursor-pointer hover:bg-white/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="glass-chip text-foreground">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {user.displayName || user.username}
                    </h3>
                    {user.isTimerPublic && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Studying
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
