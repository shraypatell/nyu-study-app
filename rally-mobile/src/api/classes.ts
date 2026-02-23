import { API_URL } from '../utils/constants';
import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  section: string | null;
  semester: string | null;
  memberCount: number;
  isJoined: boolean;
  chatRoomId: string | null;
}

export const classesApi = {
  async getClasses(joined?: boolean, search?: string) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (joined !== undefined) {
      params.append('joined', joined.toString());
    }
    if (search) {
      params.append('search', search);
    }
    const url = `${API_URL}/api/classes${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }

    return response.json();
  },

  async joinClass(classId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/classes/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ classId }),
    });

    if (!response.ok) {
      throw new Error('Failed to join class');
    }

    return response.json();
  },

  async leaveClass(classId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/classes/leave`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ classId }),
    });

    if (!response.ok) {
      throw new Error('Failed to leave class');
    }

    return response.json();
  },
};
