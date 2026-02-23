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

  async searchUsers(query: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to search users');
    }

    return response.json();
  },

  async sendRequest(usernameOrId: string) {
    const headers = await getAuthHeaders();
    
    // Check if it's a UUID (direct userId) or username
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);
    
    let userId = usernameOrId;
    
    // If it's a username, search for the user first
    if (!isUUID) {
      const searchResponse = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(usernameOrId)}`, {
        headers,
      });
      
      if (!searchResponse.ok) {
        throw new Error('User not found');
      }
      
      const searchData = await searchResponse.json();
      const users = searchData.users || [];
      
      if (users.length === 0) {
        throw new Error('User not found');
      }
      
      // Find exact username match
      const exactMatch = users.find((u: any) => u.username.toLowerCase() === usernameOrId.toLowerCase());
      if (exactMatch) {
        userId = exactMatch.id;
      } else {
        // Use first result if no exact match
        userId = users[0].id;
      }
    }
    
    const response = await fetch(`${API_URL}/api/friends`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to send friend request');
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
