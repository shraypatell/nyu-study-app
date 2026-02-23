import React, { createContext, useContext, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { useTimerStore } from '../store/timerStore';
import { FOCUS, CLASSIC, Theme } from './themes';

interface ThemeContextValue {
  t: Theme;
  isClassic: boolean;
  animBg: Animated.AnimatedInterpolation<string>;
  statusBarStyle: 'light-content' | 'dark-content';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useTimerStore((state) => state.mode);
  const isClassic = mode === 'CLASSIC';
  const t = isClassic ? CLASSIC : FOCUS;

  const animProgress = useRef(new Animated.Value(isClassic ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: isClassic ? 1 : 0,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [isClassic]);

  const animBg = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [FOCUS.bg, CLASSIC.bg],
  });

  return (
    <ThemeContext.Provider
      value={{
        t,
        isClassic,
        animBg,
        statusBarStyle: isClassic ? 'dark-content' : 'light-content',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
