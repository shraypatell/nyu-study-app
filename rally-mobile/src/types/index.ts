// User types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isTimerPublic: boolean;
  isLocationPublic: boolean;
  isClassesPublic: boolean;
}

// Auth types
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: {
    id: string;
    email: string;
  };
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  username: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserProfileResponse {
  user: User;
}

// Timer types
export type TimerMode = 'FOCUS' | 'CLASSIC';

export interface TimerState {
  isActive: boolean;
  elapsedTime: number;
  totalTimeToday: number;
  mode: TimerMode;
  currentClass: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// Friend types
export interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  totalSeconds: number;
  location?: Location;
}

// Location types
export interface Location {
  id: string;
  name: string;
  slug: string;
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalSeconds: number;
  isActive: boolean;
}

// Class types
export interface Class {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  isJoined: boolean;
}

// Chat types
export interface ChatRoom {
  id: string;
  name: string;
  type: 'DM' | 'CLASS';
  lastMessage?: Message;
  unreadCount: number;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}
