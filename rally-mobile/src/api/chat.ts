import { API_URL } from '../utils/constants';
import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

export interface ChatRoom {
  id: string;
  type: 'DM' | 'CLASS';
  name: string;
  avatarUrl: string | null;
  class: {
    id: string;
    name: string;
    code: string;
  } | null;
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

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export const chatApi = {
  async getRooms(): Promise<{ rooms: ChatRoom[]; classRooms: ChatRoom[]; dmRooms: ChatRoom[] }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/chat/rooms`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat rooms');
    }

    return response.json();
  },

  async getMessages(roomId: string, cursor?: string): Promise<{ messages: Message[]; hasMore: boolean; nextCursor: string | null }> {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/api/chat/messages`);
    url.searchParams.append('roomId', roomId);
    if (cursor) {
      url.searchParams.append('cursor', cursor);
    }

    const response = await fetch(url.toString(), {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  },

  async sendMessage(roomId: string, content: string): Promise<{ success: boolean; message: Message }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/chat/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ roomId, content }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  },

  async createDM(otherUserId: string): Promise<{ success: boolean; room: { id: string; type: string; otherUser: { id: string; username: string; displayName: string | null; avatarUrl: string | null } } }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/chat/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type: 'DM', userId: otherUserId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat room');
    }

    return response.json();
  },
};
