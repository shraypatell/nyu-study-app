"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ChatRoom {
  id: string;
  type: "CLASS" | "DM";
  name: string;
  avatarUrl: string | null;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  lastMessage: {
    content: string;
    sender: {
      id: string;
      username: string;
      displayName: string | null;
    };
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [classRooms, setClassRooms] = useState<ChatRoom[]>([]);
  const [dmRooms, setDmRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/chat/rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
        setClassRooms(data.classRooms);
        setDmRooms(data.dmRooms);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearching(false);
    }
  };

  const startDM = async (userId: string) => {
    setStartingChat(userId);
    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DM", userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsNewMessageOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        window.location.href = `/chat/room/${data.room.id}`;
      }
    } catch (error) {
      console.error("Failed to start DM:", error);
    } finally {
      setStartingChat(null);
    }
  };

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for a user..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  className="pl-10"
                />
              </div>

              {searching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startDM(user.id)}
                    disabled={startingChat === user.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    {startingChat === user.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </button>
                ))}

                {!searching &&
                  searchQuery.length >= 2 &&
                  searchResults.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No users found
                    </p>
                  )}

                {searchQuery.length < 2 && (
                  <p className="text-center text-gray-500 py-4">
                    Type at least 2 characters to search
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All
            {rooms.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {rooms.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="classes">
            <Users className="h-4 w-4 mr-1" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="dms">
            <MessageSquare className="h-4 w-4 mr-1" />
            DMs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <RoomList rooms={rooms} />
        </TabsContent>

        <TabsContent value="classes" className="mt-6">
          <RoomList rooms={classRooms} emptyMessage="No class chats yet. Join a class to start chatting!" />
        </TabsContent>

        <TabsContent value="dms" className="mt-6">
          <RoomList rooms={dmRooms} emptyMessage="No direct messages yet. Start a new conversation!" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RoomList({
  rooms,
  emptyMessage = "No messages yet",
}: {
  rooms: ChatRoom[];
  emptyMessage?: string;
}) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <Link key={room.id} href={`/chat/room/${room.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={room.avatarUrl || undefined} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {room.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{room.name}</h3>
                    {room.unreadCount > 0 && (
                      <Badge variant="destructive">{room.unreadCount}</Badge>
                    )}
                  </div>

                  {room.lastMessage ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="truncate">
                        <span className="font-medium">
                          {room.lastMessage.sender.displayName ||
                            room.lastMessage.sender.username}
                          :
                        </span>{" "}
                        {room.lastMessage.content.slice(0, 50)}
                        {room.lastMessage.content.length > 50 && "..."}
                      </span>
                      <span className="text-xs flex-shrink-0">
                        {formatDistanceToNow(
                          new Date(room.lastMessage.createdAt),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No messages yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
