import { API_URL } from '../utils/constants';
import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

export interface UserStats {
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  totalSessions: number;
  currentStreak: number;
  todaySeconds: number;
  hasActiveSession: boolean;
}

export const statsApi = {
  async getStats(): Promise<UserStats> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/stats`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }

    return response.json();
  },
};
