import { API_URL } from '../utils/constants';
import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

export const leaderboardsApi = {
  async getSchoolLeaderboard() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/leaderboards/school`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch school leaderboard');
    }

    return response.json();
  },

  async getLocationLeaderboard(locationId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/leaderboards/location/${locationId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch location leaderboard');
    }

    return response.json();
  },
};
