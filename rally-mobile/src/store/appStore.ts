import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { locationsApi, Location } from '../api/locations';
import { classesApi, ClassItem } from '../api/classes';

const SELECTED_CLASS_KEY = 'selectedStudyClass';

interface AppState {
  selectedClassId: string | null;
  selectedLocation: Location | null;
  availableLocations: Location[];
  joinedClasses: ClassItem[];
  isLoadingLocations: boolean;
  isLoadingClasses: boolean;
  locationError: string | null;

  loadJoinedClasses: () => Promise<void>;
  setSelectedClassId: (classId: string | null) => Promise<void>;
  loadLocations: () => Promise<void>;
  setSelectedLocation: (location: Location | null) => Promise<void>;
  initializeFromStorage: () => Promise<void>;
}

async function getSession() {
  // Use getUser instead of getSession for more reliable auth check
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.log('getSession: No user/error:', error?.message);
    return null;
  }
  // Get session after confirming user exists
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedClassId: null,
  selectedLocation: null,
  availableLocations: [],
  joinedClasses: [],
  isLoadingLocations: false,
  isLoadingClasses: false,
  locationError: null,

  loadJoinedClasses: async () => {
    const session = await getSession();
    if (!session) return;
    
    set({ isLoadingClasses: true });
    try {
      const data = await classesApi.getClasses(true);
      set({ joinedClasses: data.classes || [] });
    } catch (error) {
      console.error('Failed to load joined classes:', error);
    } finally {
      set({ isLoadingClasses: false });
    }
  },

  setSelectedClassId: async (classId: string | null) => {
    set({ selectedClassId: classId });
    if (classId) {
      await AsyncStorage.setItem(SELECTED_CLASS_KEY, classId);
    } else {
      await AsyncStorage.removeItem(SELECTED_CLASS_KEY);
    }
  },

  loadLocations: async () => {
    const session = await getSession();
    if (!session) {
      console.log('loadLocations: No session found');
      set({ locationError: 'Not logged in' });
      return;
    }
    
    set({ isLoadingLocations: true, locationError: null });
    try {
      console.log('loadLocations: Fetching locations and user location...');
      const [locations, userLocation] = await Promise.all([
        locationsApi.getLocations(),
        locationsApi.getUserLocation(),
      ]);
      console.log('loadLocations: Got', locations.length, 'locations, userLocation:', userLocation?.name);
      set({ 
        availableLocations: locations,
        selectedLocation: userLocation,
      });
    } catch (error: any) {
      console.error('Failed to load locations:', error);
      set({ locationError: error?.message || 'Failed to load locations' });
    } finally {
      set({ isLoadingLocations: false });
    }
  },

  setSelectedLocation: async (location: Location | null) => {
    if (!location) {
      set({ selectedLocation: null });
      return;
    }
    try {
      const savedLocation = await locationsApi.setUserLocation(location.id);
      set({ selectedLocation: savedLocation });
    } catch (error) {
      console.error('Failed to set location:', error);
      throw error;
    }
  },

  initializeFromStorage: async () => {
    const session = await getSession();
    if (!session) {
      console.log('initializeFromStorage: No session found');
      return;
    }
    
    try {
      console.log('initializeFromStorage: Loading user location...');
      const [storedClassId, userLocation] = await Promise.all([
        AsyncStorage.getItem(SELECTED_CLASS_KEY),
        locationsApi.getUserLocation().catch((err) => {
          console.log('initializeFromStorage: getUserLocation error:', err?.message || err);
          return null;
        }),
      ]);

      console.log('initializeFromStorage: userLocation:', userLocation?.name);
      set({ 
        selectedClassId: storedClassId,
        selectedLocation: userLocation,
      });
    } catch (error) {
      console.error('Failed to initialize from storage:', error);
    }
  },
}));
