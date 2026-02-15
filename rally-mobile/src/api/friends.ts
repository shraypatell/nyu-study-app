import { API_URL } from '../utils/constants';
import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

export const friendsApi = {
  async getFriends() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/friends`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch friends');
    }

    return response.json();
  },

  async sendRequest(userId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/friends`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to send friend request');
    }

    return response.json();
  },

  async getRequests() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/friends/requests`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch friend requests');
    }

    return response.json();
  },

  async acceptRequest(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/friends/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });

    if (!response.ok) {
      throw new Error('Failed to accept friend request');
    }

    return response.json();
  },

  async rejectRequest(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/friends/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to reject friend request');
    }

    return response.json();
  },
};
