# Rally Mobile App - Complete Development Plan

## Project Overview
Build a React Native mobile app for Rally (NYU Study App) using Expo SDK 50. The app mirrors the web functionality with mobile-specific enhancements including a two-mode timer system.

## Key Features
- **Authentication**: Supabase auth with biometric support
- **Two-Mode Timer System**:
  - **FOCUS Mode**: Timer pauses when app goes to background (unified source of truth stops)
  - **CLASSIC Mode**: Timer continues in background (unified source of truth keeps running)
- **Dashboard**: Live widgets, location/school leaderboards, friends
- **Social**: Friends, requests, user search, chat
- **Academic**: Classes browser, joined classes
- **Mobile Features**: Push notifications, background tasks, deep linking

---

## Phase 1: Project Setup & Core Dependencies

### 1.1 Initialize Expo Project
```bash
cd /Users/Shray/Developer/Rally
npx create-expo-app rally-mobile --template blank-typescript --yes
```

### 1.2 Install Dependencies
```bash
cd rally-mobile

# Core
npm install @supabase/supabase-js
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npm install @react-native-async-storage/async-storage
npm install expo-secure-store
npm install expo-notifications
npm install expo-background-fetch
npm install expo-task-manager
npm install expo-app-auth
npm install expo-local-authentication
npm install zustand
npm install react-native-url-polyfill

# UI Components
npm install react-native-paper
npm install react-native-vector-icons
npm install react-native-safe-area-context
npm install react-native-screens
npm install react-native-gesture-handler

# Utilities
npm install date-fns
npm install lodash.debounce
```

### 1.3 Project Structure
Create the following directory structure:
```
rally-mobile/
├── src/
│   ├── api/
│   │   ├── supabase.ts          # Supabase client setup
│   │   ├── timer.ts             # Timer API calls
│   │   ├── user.ts              # User profile API
│   │   ├── friends.ts           # Friends API
│   │   ├── classes.ts           # Classes API
│   │   ├── chat.ts              # Chat API
│   │   └── leaderboards.ts      # Leaderboard API
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Avatar.tsx
│   │   ├── timer/               # Timer-specific components
│   │   │   ├── TimerDisplay.tsx
│   │   │   ├── TimerControls.tsx
│   │   │   └── ModeToggle.tsx
│   │   ├── friends/
│   │   │   ├── FriendCard.tsx
│   │   │   ├── FriendRequestCard.tsx
│   │   │   └── UserSearchResult.tsx
│   │   └── leaderboard/
│   │       ├── LeaderboardEntry.tsx
│   │       └── LeaderboardList.tsx
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── BiometricPrompt.tsx
│   │   ├── Main/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── TimerScreen.tsx
│   │   │   ├── FriendsScreen.tsx
│   │   │   ├── LeaderboardsScreen.tsx
│   │   │   ├── ClassesScreen.tsx
│   │   │   ├── ChatListScreen.tsx
│   │   │   ├── ChatRoomScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx     # Root navigator
│   │   ├── AuthNavigator.tsx    # Auth stack
│   │   └── MainNavigator.tsx    # Main tab navigator
│   ├── hooks/
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useTimer.ts          # Timer hook with AppState
│   │   ├── useStudySession.ts   # Study session management
│   │   ├── useFriends.ts        # Friends data hook
│   │   ├── useClasses.ts        # Classes data hook
│   │   ├── useChat.ts           # Chat data hook
│   │   └── useNotifications.ts  # Push notifications hook
│   ├── store/
│   │   ├── authStore.ts         # Zustand auth store
│   │   ├── timerStore.ts        # Zustand timer store
│   │   └── userStore.ts         # Zustand user store
│   ├── utils/
│   │   ├── time.ts              # Time formatting utilities
│   │   ├── constants.ts         # App constants
│   │   └── notifications.ts     # Notification helpers
│   └── types/
│       └── index.ts             # TypeScript types
├── App.tsx                      # Entry point
├── app.json                     # Expo config
└── babel.config.js              # Babel config
```

### 1.4 Configuration Files

**app.json**:
```json
{
  "expo": {
    "name": "Rally",
    "slug": "rally-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.rally",
      "infoPlist": {
        "NSFaceIDUsageDescription": "Use Face ID for quick login"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.rally"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#111111"
        }
      ],
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID for quick login"
        }
      ]
    ]
  }
}
```

---

## Phase 2: Authentication System

### 2.1 Supabase Client Setup
**File**: `src/api/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type User = {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};
```

### 2.2 Auth Store (Zustand)
**File**: `src/store/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      biometricEnabled: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Fetch user profile from backend
        const profile = await fetchUserProfile(data.session.access_token);
        set({ 
          user: profile, 
          session: data.session,
          isAuthenticated: true 
        });
      },

      signUp: async (email, password, username) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: 'https://rallystudy.app/auth/callback',
          },
        });
        if (error) throw error;
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, isAuthenticated: false });
      },

      checkSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await fetchUserProfile(session.access_token);
          set({ 
            user: profile, 
            session,
            isAuthenticated: true,
            isLoading: false 
          });
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

async function fetchUserProfile(token: string): Promise<User> {
  const response = await fetch('https://rallystudy.app/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.user;
}
```

### 2.3 Login Screen
**File**: `src/screens/Auth/LoginScreen.tsx`

Features:
- Email/password inputs
- NYU email validation
- Biometric login option (Face ID/Touch ID)
- Error handling
- Link to signup

### 2.4 Signup Screen
**File**: `src/screens/Auth/SignupScreen.tsx`

Features:
- Email, username, password inputs
- NYU email validation (@nyu.edu)
- Username format validation
- Error messages
- Success confirmation

### 2.5 Biometric Authentication
**File**: `src/screens/Auth/BiometricPrompt.tsx`

Use `expo-local-authentication` to:
- Check if biometric is available
- Prompt for Face ID/Touch ID
- Store preference in secure storage
- Quick login on app open

---

## Phase 3: Two-Mode Timer System (Core Feature)

### 3.1 Timer Store
**File**: `src/store/timerStore.ts`

```typescript
import { create } from 'zustand';

type TimerMode = 'FOCUS' | 'CLASSIC';

interface TimerState {
  isActive: boolean;
  elapsedTime: number;        // Current session time
  totalTimeToday: number;     // Total time for today
  mode: TimerMode;
  currentClass: { id: string; name: string; code: string } | null;
  
  // Actions
  setMode: (mode: TimerMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  incrementElapsed: (seconds: number) => void;
  setCurrentClass: (classInfo: { id: string; name: string; code: string } | null) => void;
  setTotalTimeToday: (seconds: number) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isActive: false,
  elapsedTime: 0,
  totalTimeToday: 0,
  mode: 'CLASSIC', // Default mode
  currentClass: null,

  setMode: (mode) => {
    // If switching modes while timer is active, pause first
    if (get().isActive) {
      get().pauseTimer();
    }
    set({ mode });
  },

  startTimer: () => set({ isActive: true }),
  pauseTimer: () => set({ isActive: false }),
  resetTimer: () => set({ isActive: false, elapsedTime: 0 }),
  incrementElapsed: (seconds) => set((state) => ({ 
    elapsedTime: state.elapsedTime + seconds 
  })),
  setCurrentClass: (classInfo) => set({ currentClass: classInfo }),
  setTotalTimeToday: (seconds) => set({ totalTimeToday: seconds }),
}));
```

### 3.2 useTimer Hook with AppState
**File**: `src/hooks/useTimer.ts`

This is the MOST CRITICAL hook. It handles the two-mode system:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useTimerStore } from '../store/timerStore';
import { api } from '../api/timer';

export function useTimer() {
  const {
    isActive,
    elapsedTime,
    mode,
    startTimer,
    pauseTimer,
    incrementElapsed,
    setTotalTimeToday,
  } = useTimerStore();

  const lastTimeRef = useRef(Date.now());
  const appStateRef = useRef(AppState.currentState);

  // Handle timer tick (every second when active)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTimeRef.current) / 1000);
        
        if (delta >= 1) {
          incrementElapsed(delta);
          lastTimeRef.current = now;
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, incrementElapsed]);

  // Handle app state changes (BACKGROUND/FOREGROUND)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [mode, isActive]);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    const currentState = appStateRef.current;
    
    // App going to background
    if (currentState === 'active' && nextAppState.match(/inactive|background/)) {
      if (isActive) {
        if (mode === 'FOCUS') {
          // FOCUS MODE: Pause timer immediately
          await pauseTimerAPI();
          pauseTimer();
          
          // Send notification that timer paused
          sendLocalNotification(
            'Timer Paused',
            'Your study timer was paused because you left the app (FOCUS mode)'
          );
        } 
        // CLASSIC MODE: Timer continues, no action needed
        // The unified source of truth timer keeps running via backend heartbeat
      }
    }
    
    // App returning to foreground
    if (currentState.match(/inactive|background/) && nextAppState === 'active') {
      // Sync with server to get accurate time
      await syncTimerStatus();
    }

    appStateRef.current = nextAppState;
  }, [mode, isActive]);

  // Heartbeat every 30 seconds to keep session alive
  useEffect(() => {
    if (!isActive) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await api.sendHeartbeat();
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [isActive]);

  // Sync timer status from server
  const syncTimerStatus = async () => {
    try {
      const status = await api.getTimerStatus();
      setTotalTimeToday(status.totalSecondsToday);
      
      if (status.isActive) {
        // Calculate live time
        const sessionDuration = Math.floor(
          (Date.now() - new Date(status.currentDuration * 1000).getTime()) / 1000
        );
        // Update local state
      }
    } catch (error) {
      console.error('Failed to sync timer:', error);
    }
  };

  // Start study session
  const handleStart = async () => {
    try {
      await api.startTimer();
      lastTimeRef.current = Date.now();
      startTimer();
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  // Pause study session
  const handlePause = async () => {
    try {
      const result = await api.pauseTimer();
      pauseTimer();
      setTotalTimeToday((prev) => prev + result.totalDuration);
      // Reset elapsed time for next session
      useTimerStore.getState().resetTimer();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  return {
    elapsedTime,
    totalTimeToday,
    isActive,
    mode,
    handleStart,
    handlePause,
    syncTimerStatus,
  };
}

// Helper function
async function pauseTimerAPI() {
  try {
    await api.pauseTimer();
  } catch (error) {
    console.error('Failed to pause timer on background:', error);
  }
}
```

### 3.3 Timer API
**File**: `src/api/timer.ts`

```typescript
import { API_URL } from '../utils/constants';
import { supabase } from './supabase';

export const timerApi = {
  async startTimer(classId?: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    const response = await fetch(`${API_URL}/api/timer/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ classId }),
    });
    return response.json();
  },

  async pauseTimer() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    const response = await fetch(`${API_URL}/api/timer/pause`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async sendHeartbeat() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    await fetch(`${API_URL}/api/timer/heartbeat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getTimerStatus() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    const response = await fetch(`${API_URL}/api/timer/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },
};
```

### 3.4 Timer Screen
**File**: `src/screens/Main/TimerScreen.tsx`

Features:
- Large timer display (hours:minutes:seconds)
- Mode toggle (FOCUS/CLASSIC) with clear explanation
- Start/Pause button
- Class selector dropdown
- Total time today display
- Visual indicator of current mode

---

## Phase 4: Dashboard Screen

### 4.1 Dashboard Screen
**File**: `src/screens/Main/DashboardScreen.tsx`

Features:
- Welcome header with user's name
- Today's study time summary
- Location leaderboard card (top 5)
- School leaderboard card (top 5)
- Friends activity card (top 5)
- Quick start timer button

### 4.2 API Integration
**File**: `src/api/dashboard.ts`

Fetch dashboard data from `/api/dashboard` endpoint (already exists in web app).

---

## Phase 5: Friends & Social

### 5.1 Friends Screen
**File**: `src/screens/Main/FriendsScreen.tsx`

Use existing PillNav pattern with tabs:
- Friends (list of friends with online status)
- Requests (incoming friend requests)
- Sent (sent requests)
- Search (find new friends)

### 5.2 Friend Components
- `FriendCard`: Avatar, name, status, study time
- `FriendRequestCard`: Accept/reject buttons
- `UserSearchResult`: Add friend button

### 5.3 API Integration
**File**: `src/api/friends.ts`

- GET `/api/friends` - List friends
- GET `/api/friends/requests` - Get requests
- POST `/api/friends` - Send request
- PUT `/api/friends/:id` - Accept request
- DELETE `/api/friends/:id` - Remove friend/reject request

---

## Phase 6: Leaderboards

### 6.1 Leaderboards Screen
**File**: `src/screens/Main/LeaderboardsScreen.tsx`

Tabs:
- School (all NYU students)
- Location (students at your location)

### 6.2 Leaderboard Components
- `LeaderboardEntry`: Rank, avatar, name, time, status
- `LeaderboardList`: Scrollable list with pull-to-refresh

### 6.3 API Integration
**File**: `src/api/leaderboards.ts`

- GET `/api/leaderboards/school`
- GET `/api/leaderboards/location/:id`

---

## Phase 7: Classes

### 7.1 Classes Screen
**File**: `src/screens/Main/ClassesScreen.tsx`

Tabs:
- Browse (all available classes)
- My Classes (joined classes)

### 7.2 API Integration
**File**: `src/api/classes.ts`

- GET `/api/classes` - Browse classes
- GET `/api/classes?joined=true` - My classes
- POST `/api/classes/join` - Join class
- POST `/api/classes/leave` - Leave class

---

## Phase 8: Chat

### 8.1 Chat List Screen
**File**: `src/screens/Main/ChatListScreen.tsx`

List of all chat rooms (DMs and class chats)

### 8.2 Chat Room Screen
**File**: `src/screens/Main/ChatRoomScreen.tsx`

Individual chat room with:
- Message list
- Message input
- Real-time updates (or polling every 5 seconds)

### 8.3 API Integration
**File**: `src/api/chat.ts`

- GET `/api/chat/rooms` - List rooms
- GET `/api/chat/rooms/:id/messages` - Get messages
- POST `/api/chat/rooms/:id/messages` - Send message

---

## Phase 9: Profile & Settings

### 9.1 Profile Screen
**File**: `src/screens/Main/ProfileScreen.tsx`

- User info display
- Edit profile (display name, bio, avatar)
- Privacy settings toggle
- Sign out button

### 9.2 API Integration
**File**: `src/api/user.ts`

- GET `/api/users/me` - Get profile
- PUT `/api/users/me` - Update profile

---

## Phase 10: Push Notifications

### 10.1 Notification Setup
**File**: `src/utils/notifications.ts`

```typescript
import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export function sendLocalNotification(title: string, body: string) {
  Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
```

### 10.2 Notification Triggers
- Timer paused (FOCUS mode)
- Friend request received
- New chat message
- Study reminder (scheduled)

---

## Phase 11: Navigation Setup

### 11.1 Navigation Structure
**File**: `src/navigation/AppNavigator.tsx`

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// Main Tabs
function MainNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Leaderboards" component={LeaderboardsScreen} />
      <Tab.Screen name="Classes" component={ClassesScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root Navigator
export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
```

---

## Phase 12: TypeScript Types

### 12.1 Core Types
**File**: `src/types/index.ts`

```typescript
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

export interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  totalSeconds: number;
  location?: Location;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalSeconds: number;
  isActive: boolean;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  isJoined: boolean;
}

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

export interface Location {
  id: string;
  name: string;
  slug: string;
  parent?: Location;
}
```

---

## Phase 13: Testing & Deployment

### 13.1 Testing Checklist
- [ ] Authentication flow (login, signup, biometric)
- [ ] Timer modes (FOCUS vs CLASSIC)
- [ ] App state transitions (background/foreground)
- [ ] API error handling
- [ ] Offline behavior
- [ ] Push notifications

### 13.2 Build Commands
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Build for stores
npx expo build:ios
npx expo build:android
```

---

## Implementation Order (Priority)

### Week 1: Foundation
1. Project setup
2. Navigation structure
3. Auth screens (Login, Signup)
4. Auth store with Supabase

### Week 2: Timer (Core Feature)
1. Two-mode timer store
2. useTimer hook with AppState
3. Timer screen with mode toggle
4. API integration

### Week 3: Dashboard & Leaderboards
1. Dashboard screen
2. Leaderboard screens
3. Dashboard widgets

### Week 4: Friends & Social
1. Friends screen
2. Friend requests
3. User search

### Week 5: Classes & Chat
1. Classes screen
2. Chat list
3. Chat room

### Week 6: Polish & Mobile Features
1. Push notifications
2. Biometric auth
3. Background tasks
4. Error handling
5. Performance optimization

---

## Notes for Implementation

1. **Two-Mode Timer**: This is the unique selling point. Make sure the FOCUS vs CLASSIC distinction is clear in the UI.

2. **Unified Source of Truth**: The web app timer and mobile timer share the same backend. Changes on one should reflect on the other.

3. **Background Handling**: iOS is strict about background execution. Use background fetch for heartbeat, but timer accuracy depends on returning to foreground.

4. **Supabase Auth**: Session tokens expire. Use autoRefreshToken: true.

5. **Error Handling**: Network requests can fail. Add retry logic and offline indicators.

---

## Ready to Execute

This plan is ready for Sisyphus to implement. Run `/start-work` to begin building the Rally mobile app!
