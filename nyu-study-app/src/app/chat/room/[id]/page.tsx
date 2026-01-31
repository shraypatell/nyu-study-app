"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface RoomInfo {
  id: string;
  name: string;
  type: "CLASS" | "DM";
}

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const { messages, isConnected } = useRealtimeMessages(
    roomId,
    initialMessages
  );

  useEffect(() => {
    fetchRoomData();
  }, [roomId]);

  useEffect(() => {
    if (shouldScrollToBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, shouldScrollToBottom]);

  const fetchRoomData = async () => {
    try {
      const [roomResponse, messagesResponse] = await Promise.all([
        fetch(`/api/chat/rooms`),
        fetch(`/api/chat/messages?roomId=${roomId}`),
      ]);

      if (roomResponse.ok && messagesResponse.ok) {
        const roomsData = await roomResponse.json();
        const messagesData = await messagesResponse.json();

        const room = roomsData.rooms.find((r: RoomInfo) => r.id === roomId);
        if (room) {
          setRoomInfo(room);
        }
        setInitialMessages(messagesData.messages);
      }
    } catch (error) {
      console.error("Failed to fetch room data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
        setShouldScrollToBottom(true);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldScrollToBottom(isNearBottom);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-4 px-4 h-[calc(100vh-2rem)]">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <CardTitle>{roomInfo?.name || "Chat"}</CardTitle>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
              title={isConnected ? "Connected" : "Reconnecting..."}
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea
            className="flex-1 p-4"
            ref={scrollRef}
            onScroll={handleScroll}
          >
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isCurrentUser = message.sender.id === "current-user";
                  const showAvatar =
                    index === 0 ||
                    messages[index - 1].sender.id !== message.sender.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isCurrentUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      {showAvatar ? (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={message.sender.avatarUrl || undefined} />
                          <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                            {message.sender.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}

                      <div
                        className={`max-w-[70%] ${
                          isCurrentUser ? "items-end" : "items-start"
                        }`}
                      >
                        {showAvatar && (
                          <p className="text-xs text-gray-500 mb-1">
                            {message.sender.displayName || message.sender.username}
                          </p>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isCurrentUser
                              ? "bg-purple-600 text-white rounded-br-none"
                              : "bg-gray-100 text-gray-900 rounded-bl-none"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <form
            onSubmit={sendMessage}
            className="border-t p-4 flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewMessage(e.target.value)
              }
              placeholder="Type a message..."
              className="flex-1"
              maxLength={2000}
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
