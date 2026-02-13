import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';

export default function TimerScreen() {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'FOCUS' | 'CLASSIC'>('CLASSIC');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (mode === 'FOCUS' && nextAppState === 'background') {
        setIsActive(false);
      }
    });

    return () => subscription.remove();
  }, [mode]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'FOCUS' && styles.modeButtonActive]}
          onPress={() => {
            if (isActive) setIsActive(false);
            setMode('FOCUS');
          }}
        >
          <Text style={[styles.modeText, mode === 'FOCUS' && styles.modeTextActive]}>
            FOCUS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'CLASSIC' && styles.modeButtonActive]}
          onPress={() => {
            if (isActive) setIsActive(false);
            setMode('CLASSIC');
          }}
        >
          <Text style={[styles.modeText, mode === 'CLASSIC' && styles.modeTextActive]}>
            CLASSIC
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.modeDescription}>
        {mode === 'FOCUS' 
          ? 'Timer pauses when you leave the app'
          : 'Timer continues in the background'}
      </Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatTime(seconds)}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isActive ? styles.stopButton : styles.startButton]}
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.buttonText}>
          {isActive ? 'Pause' : 'Start'}
        </Text>
      </TouchableOpacity>

      {seconds > 0 && !isActive && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => setSeconds(0)}
        >
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  modeButtonActive: {
    backgroundColor: '#111',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeTextActive: {
    color: '#fff',
  },
  modeDescription: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 48,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  timer: {
    fontSize: 64,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignItems: 'center',
    alignSelf: 'center',
  },
  startButton: {
    backgroundColor: '#111',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: 16,
    alignSelf: 'center',
    padding: 12,
  },
  resetText: {
    color: '#666',
    fontSize: 14,
  },
});
