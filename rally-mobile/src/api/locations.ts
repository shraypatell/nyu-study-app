import { API_URL } from '../utils/constants';
import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }>;
  isParent: boolean;
}

export const locationsApi = {
  async getLocations() {
    const headers = await getAuthHeaders();
    console.log('getLocations: headers:', headers);
    const response = await fetch(`${API_URL}/api/locations`, {
      headers,
    });

    console.log('getLocations: response status:', response.status);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.log('getLocations: error:', error);
      throw new Error('Failed to fetch locations');
    }

    const data = await response.json();
    console.log('getLocations: data:', data);
    return data.locations as Location[];
  },

  async getUserLocation() {
    const headers = await getAuthHeaders();
    console.log('getUserLocation: headers:', headers);
    const response = await fetch(`${API_URL}/api/user/location`, {
      headers,
    });

    console.log('getUserLocation: response status:', response.status);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.log('getUserLocation: error:', error);
      throw new Error('Failed to fetch user location');
    }

    const data = await response.json();
    console.log('getUserLocation: data:', data);
    return data.location as Location | null;
  },

  async setUserLocation(locationId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/user/location`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ locationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set location');
    }

    const data = await response.json();
    return data.location as Location;
  },
};
