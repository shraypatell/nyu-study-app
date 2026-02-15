import { API_URL } from '../utils/constants';
import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

export const timerApi = {
  async getStatus() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/timer/status`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get timer status');
    }

    return response.json();
  },

  async startTimer(classId?: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/timer/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ classId }),
    });

    if (!response.ok) {
      throw new Error('Failed to start timer');
    }

    return response.json();
  },

  async pauseTimer() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/timer/pause`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to pause timer');
    }

    return response.json();
  },
};
