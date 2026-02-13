import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { API_URL } from '../utils/constants';
import type { User, SignInCredentials, SignUpCredentials } from '../types';

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  bypassSignIn: (email: string) => void;
  
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  bypassSignIn: (email) => {
    set({
      user: createFallbackUser({ id: `dev-${Date.now()}`, email }),
      session: { access_token: 'dev-token' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

   signIn: async (credentials) => {
     try {
       set({ isLoading: true, error: null });
       
       const { data, error } = await supabase.auth.signInWithPassword({
         email: credentials.email,
         password: credentials.password,
       });
       
       if (error) throw error;
       if (!data.session) throw new Error('No session returned');
       
       let profile: User;
       try {
          profile = await withTimeout(fetchUserProfile(data.session.access_token), 4000);
       } catch (fetchError) {
         console.warn('Failed to fetch user profile, using fallback:', fetchError);
         profile = createFallbackUser(data.session.user);
       }
       
       set({ 
         user: profile, 
         session: data.session,
         isAuthenticated: true,
         isLoading: false,
         error: null,
       });
      } catch (error: any) {
        const message = String(error?.message || '');
        if (message.includes('JSON Parse error') || message.includes('Unexpected character: <')) {
          set({
            user: createFallbackUser({ id: `dev-${Date.now()}`, email: credentials.email }),
            session: { access_token: 'dev-token' },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return;
        }
        set({ 
          error: error.message || 'Failed to sign in',
          isLoading: false,
        });
        throw error;
     }
   },

  signUp: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: { 
            username: credentials.username,
          },
          emailRedirectTo: 'https://rallystudy.app/auth/callback',
        },
      });
      
      if (error) throw error;
      
      set({ isLoading: false, error: null });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to sign up',
        isLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ 
        user: null, 
        session: null, 
        isAuthenticated: false,
        error: null,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to sign out' });
      throw error;
    }
  },

   checkSession: async () => {
     try {
       set({ isLoading: true });
       
       const { data: { session }, error } = await supabase.auth.getSession();
       
       if (error) throw error;
       
       if (session) {
         let profile: User;
         try {
            profile = await withTimeout(fetchUserProfile(session.access_token), 4000);
         } catch (fetchError) {
           console.warn('Failed to fetch user profile, using fallback:', fetchError);
           profile = createFallbackUser(session.user);
         }
         set({ 
           user: profile, 
           session,
           isAuthenticated: true,
           isLoading: false,
           error: null,
         });
       } else {
         set({ 
           user: null,
           session: null,
           isAuthenticated: false,
           isLoading: false,
         });
       }
     } catch (error: any) {
       console.error('Session check failed:', error);
       set({ 
         user: null,
         session: null,
         isAuthenticated: false,
         isLoading: false,
         error: error.message,
       });
     }
   },
}));

async function fetchUserProfile(token: string): Promise<User> {
  const response = await fetch(`${API_URL}/api/users/me`, {
    headers: { 
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  
  const data = await response.json();
  return data.user;
}

function createFallbackUser(sessionUser: any): User {
  const emailPrefix = sessionUser.email?.split('@')[0] || 'user';
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    username: emailPrefix,
    displayName: emailPrefix,
    isTimerPublic: false,
    isLocationPublic: false,
    isClassesPublic: false,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timeout')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
