import { create } from 'zustand';
import { timerApi } from '../api/timer';

export type TimerMode = 'FOCUS' | 'CLASSIC';

interface ModeTimer {
  isActive: boolean;
  elapsedTime: number;
  totalTimeToday: number;
  sessionDuration: number;
}

interface TimerState {
  timers: {
    CLASSIC: ModeTimer;
    FOCUS: ModeTimer;
  };
  mode: TimerMode;
  currentClass: { id: string; name: string; code: string } | null;
  isLoading: boolean;
  error: string | null;

  setMode: (mode: TimerMode) => void;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: () => void;
  incrementElapsed: (seconds: number) => void;
  incrementSessionDuration: (seconds: number) => void;
  setCurrentClass: (classInfo: { id: string; name: string; code: string } | null) => void;
  syncStatus: () => Promise<void>;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  timers: {
    CLASSIC: {
      isActive: false,
      elapsedTime: 0,
      totalTimeToday: 0,
      sessionDuration: 0,
    },
    FOCUS: {
      isActive: false,
      elapsedTime: 0,
      totalTimeToday: 0,
      sessionDuration: 0,
    },
  },
  mode: 'CLASSIC',
  currentClass: null,
  isLoading: false,
  error: null,

  setMode: (mode) => {
    const state = get();
    if (state.timers[state.mode].isActive) {
      get().pauseTimer();
    }
    set({ mode });
  },

  startTimer: async () => {
    try {
      const state = get();
      set({ isLoading: true, error: null });
      const response = await timerApi.startTimer(state.currentClass?.id, state.mode);

      if (response.success) {
        set((s) => ({
          timers: {
            ...s.timers,
            [s.mode]: {
              ...s.timers[s.mode],
              isActive: true,
              sessionDuration: 0,
            },
          },
          isLoading: false,
        }));
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  pauseTimer: async () => {
    try {
      const state = get();
      set({ isLoading: true, error: null });
      const response = await timerApi.pauseTimer(state.mode);

      if (response.success) {
        set((s) => ({
          timers: {
            ...s.timers,
            [s.mode]: {
              ...s.timers[s.mode],
              isActive: false,
              totalTimeToday: s.timers[s.mode].totalTimeToday + response.totalDuration,
              sessionDuration: response.sessionDuration || response.totalDuration,
            },
          },
          isLoading: false,
        }));
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  resetTimer: () => {
    set((s) => ({
      timers: {
        ...s.timers,
        [s.mode]: {
          ...s.timers[s.mode],
          isActive: false,
          elapsedTime: 0,
        },
      },
    }));
  },

  incrementElapsed: (seconds) => {
    set((s) => ({
      timers: {
        ...s.timers,
        [s.mode]: {
          ...s.timers[s.mode],
          elapsedTime: s.timers[s.mode].elapsedTime + seconds,
          sessionDuration: s.timers[s.mode].sessionDuration + seconds,
        },
      },
    }));
  },

  incrementSessionDuration: (seconds) => {
    set((s) => ({
      timers: {
        ...s.timers,
        [s.mode]: {
          ...s.timers[s.mode],
          sessionDuration: s.timers[s.mode].sessionDuration + seconds,
        },
      },
    }));
  },

  setCurrentClass: (classInfo) => {
    set({ currentClass: classInfo });
  },

  syncStatus: async () => {
    try {
      const mode = get().mode;
      const status = await timerApi.getStatus(mode);
      set((s) => ({
        timers: {
          ...s.timers,
          [mode]: {
            ...s.timers[mode],
            isActive: status.isActive,
            totalTimeToday: status.totalSecondsToday,
            elapsedTime:
              status.isActive && status.startedAt
                ? Math.floor((new Date().getTime() - new Date(status.startedAt).getTime()) / 1000)
                : status.lastSessionDuration || s.timers[mode].elapsedTime,
            // Only sync session duration if timer is paused to avoid jumping during active sessions
            sessionDuration: !status.isActive ? (status.currentSessionDuration || 0) : s.timers[mode].sessionDuration,
          },
        },
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
