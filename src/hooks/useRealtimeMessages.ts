"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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
  refreshMessages: () => Promise<void>;
}

const POLLING_INTERVAL = 3000;

export function useRealtimeMessages(
  roomId: string | null,
  initialMessages: Message[] = []
): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/chat/messages?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages((prevMessages) => {
          const newMessages = data.messages || [];
          const messageMap = new Map(prevMessages.map((m) => [m.id, m]));
          
          newMessages.forEach((msg: Message) => {
            if (!messageMap.has(msg.id)) {
              messageMap.set(msg.id, msg);
            }
          });
          
          return Array.from(messageMap.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setIsConnected(false);
      setError("Connection error");
    }
  }, [roomId]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setIsConnected(true);
      setError(null);
      return;
    }

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsVisible(visible);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      fetchMessages();
      
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchMessages();
        }
      }, POLLING_INTERVAL);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPolling();
    };
  }, [roomId, fetchMessages]);

  useEffect(() => {
    if (isVisible && roomId) {
      fetchMessages();
    }
  }, [isVisible, roomId, fetchMessages]);

  return { 
    messages, 
    isConnected, 
    error,
    refreshMessages: fetchMessages 
  };
}
