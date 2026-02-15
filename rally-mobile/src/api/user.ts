import { API_URL } from '../utils/constants';
import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

export const userApi = {
  async getProfile() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  },

  async updateProfile(data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    isTimerPublic?: boolean;
    isClassesPublic?: boolean;
    isLocationPublic?: boolean;
    username?: string;
  }) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return response.json();
  },
};
