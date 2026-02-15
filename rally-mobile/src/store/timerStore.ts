import { create } from 'zustand';
import { timerApi } from '../api/timer';

export type TimerMode = 'FOCUS' | 'CLASSIC';

interface TimerState {
  isActive: boolean;
  elapsedTime: number;
  totalTimeToday: number;
  mode: TimerMode;
  currentClass: { id: string; name: string; code: string } | null;
  isLoading: boolean;
  error: string | null;

  setMode: (mode: TimerMode) => void;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: () => void;
  incrementElapsed: (seconds: number) => void;
  setCurrentClass: (classInfo: { id: string; name: string; code: string } | null) => void;
  syncStatus: () => Promise<void>;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isActive: false,
  elapsedTime: 0,
  totalTimeToday: 0,
  mode: 'CLASSIC',
  currentClass: null,
  isLoading: false,
  error: null,

  setMode: (mode) => {
    if (get().isActive) {
      get().pauseTimer();
    }
    set({ mode });
  },

  startTimer: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await timerApi.startTimer(get().currentClass?.id);
      
      if (response.success) {
        set({ 
          isActive: true, 
          isLoading: false,
          elapsedTime: 0,
        });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  pauseTimer: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await timerApi.pauseTimer();
      
      if (response.success) {
        set((state) => ({ 
          isActive: false, 
          isLoading: false,
          totalTimeToday: state.totalTimeToday + response.totalDuration,
          elapsedTime: 0,
        }));
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  resetTimer: () => {
    set({ isActive: false, elapsedTime: 0 });
  },

  incrementElapsed: (seconds) => {
    set((state) => ({ elapsedTime: state.elapsedTime + seconds }));
  },

  setCurrentClass: (classInfo) => {
    set({ currentClass: classInfo });
  },

  syncStatus: async () => {
    try {
      const status = await timerApi.getStatus();
      set({
        isActive: status.isActive,
        totalTimeToday: status.totalSecondsToday,
      });
      
      if (status.isActive && status.startedAt) {
        const now = new Date();
        const startedAt = new Date(status.startedAt);
        const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
        set({ elapsedTime: elapsed });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
