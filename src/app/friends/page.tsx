"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageCircle, UserX, Search, UserCheck, Clock } from "lucide-react";
import Link from "next/link";

interface Friend {
  friendshipId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isTimerPublic: boolean;
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

  useEffect(() => {
    fetchData();
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

  const filteredFriends = friends.filter(
    (friend) =>
      friend.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.user.displayName &&
        friend.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Friends</h1>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            Friends
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {friends.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="received">
            Requests
            {receivedRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {receivedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
            <div className="text-center py-12 text-gray-500">
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
              {filteredFriends.map((friend) => (
                <Card key={friend.friendshipId}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={friend.user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {friend.user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {friend.user.displayName || friend.user.username}
                        </h3>
                        {friend.user.isTimerPublic && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-700"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Studying
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        @{friend.user.username}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/chat/${friend.user.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </Link>
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
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          {receivedRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.requester?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {request.requester?.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {request.requester?.displayName || request.requester?.username}
                      </h3>
                      <p className="text-sm text-gray-500">
                        @{request.requester?.username}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => respondToRequest(request.id, "ACCEPTED")}
                        disabled={processingRequest === request.id}
                      >
                        {processingRequest === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Accept"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => respondToRequest(request.id, "REJECTED")}
                        disabled={processingRequest === request.id}
                      >
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {sentRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No sent requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.addressee?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {request.addressee?.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {request.addressee?.displayName || request.addressee?.username}
                      </h3>
                      <p className="text-sm text-gray-500">
                        @{request.addressee?.username}
                      </p>
                    </div>

                    <Badge variant="secondary">Pending</Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelRequest(request.id)}
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
