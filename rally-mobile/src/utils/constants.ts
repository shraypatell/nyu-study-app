export const SUPABASE_URL = 'https://cyrfsshxwnacemxdazsb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cmZzc2h4d25hY2VteGRhenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTk5MTMsImV4cCI6MjA4NTM3NTkxM30.1e13AjLtyKPLdVTrN3dYxlxW9enTalJMIRzto4Y9lrs';

// API endpoints
export const API_URL = 'https://rallystudy.app';

// Storage keys
export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  TIMER: 'timer-storage',
  USER_PREFERENCES: 'user-preferences',
} as const;

// Timer configuration
export const TIMER_CONFIG = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  SYNC_INTERVAL: 5000, // 5 seconds
} as const;
