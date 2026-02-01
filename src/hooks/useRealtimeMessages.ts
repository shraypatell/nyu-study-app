"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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

interface UseRealtimeMessagesReturn {
  messages: Message[];
  isConnected: boolean;
  error: string | null;
}

export function useRealtimeMessages(
  roomId: string | null,
  initialMessages: Message[] = []
): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/chat/messages?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [roomId]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setIsConnected(false);
      return;
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `roomId=eq.${roomId}`,
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            content: string;
            senderId: string;
            createdAt: string;
          };

          try {
            const response = await fetch(`/api/users/${newMessage.senderId}`);
            if (response.ok) {
              const senderData = await response.json();
              const message: Message = {
                id: newMessage.id,
                content: newMessage.content,
                sender: {
                  id: senderData.id,
                  username: senderData.username,
                  displayName: senderData.displayName,
                  avatarUrl: senderData.avatarUrl,
                },
                createdAt: newMessage.createdAt,
              };

              setMessages((prev) => {
                if (prev.some((m) => m.id === message.id)) {
                  return prev;
                }
                return [...prev, message];
              });
            }
          } catch (err) {
            console.error("Failed to fetch sender info:", err);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          setError("Connection error");
        } else if (status === "TIMED_OUT") {
          setIsConnected(false);
          setError("Connection timed out");
        }
      });

    const pollingInterval = setInterval(() => {
      if (!isConnected) {
        fetchMessages();
      }
    }, 5000);

    return () => {
      channel.unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [roomId, supabase, isConnected, fetchMessages]);

  return { messages, isConnected, error };
}
