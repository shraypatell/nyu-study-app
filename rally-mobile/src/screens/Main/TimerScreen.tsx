import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
  ActivityIndicator,
  StatusBar,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTimerStore } from '../../store/timerStore';
import { useAppStore } from '../../store/appStore';
import { useAppTheme } from '../../theme/ThemeContext';
import { StudyContextDisplay } from '../../components/StudyContextDisplay';
import { LocationLeaderboard } from '../../components/LocationLeaderboard';
import { AppHeaderSelector } from '../../components/AppHeaderSelector';

export default function TimerScreen() {
  const {
    timers,
    mode,
    isLoading,
    error,
    setMode,
    startTimer,
    pauseTimer,
    resetTimer,
    incrementElapsed,
    syncStatus,
    currentClass,
    setCurrentClass,
  } = useTimerStore();

  // Get current mode's timer state
  const isActive = timers[mode].isActive;
  const elapsedTime = timers[mode].elapsedTime;
  const sessionDuration = timers[mode].sessionDuration;

  const { selectedClassId, joinedClasses, selectedLocation } = useAppStore();
  const { t, animBg, statusBarStyle } = useAppTheme();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectorRef = useRef<any>(null);
  const [syncing, setSyncing] = useState(true);
  const [leaderboardTab, setLeaderboardTab] = useState<'school' | 'location'>('school');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    syncStatus().finally(() => setSyncing(false));
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = joinedClasses.find(c => c.id === selectedClassId);
      if (selectedClass) {
        setCurrentClass({ id: selectedClass.id, name: selectedClass.name, code: selectedClass.code });
      }
    } else {
      setCurrentClass(null);
    }
  }, [selectedClassId, joinedClasses]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => { incrementElapsed(1); }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, incrementElapsed]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (mode === 'FOCUS' && nextAppState === 'background' && isActive) pauseTimer();
      if (nextAppState === 'active') syncStatus();
    });
    return () => subscription.remove();
  }, [mode, isActive, pauseTimer, syncStatus]);

  // Periodic sync every 30 seconds for cross-device timer sync
  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncStatus().catch(err => console.error('Background sync error:', err));
    }, 30000);
    return () => clearInterval(syncInterval);
  }, [syncStatus]);

  const handleStartPause = async () => {
    try {
      if (isActive) await pauseTimer();
      else await startTimer();
    } catch (err) {
      console.error('Timer error:', err);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSubLabel = () => {
    if (isActive) return 'focus session';
    if (elapsedTime > 0) return 'session paused';
    return 'ready to focus';
  };

  const sessionLabel = currentClass ? currentClass.code : 'FLOW 1';

  if (syncing) {
    return (
      <Animated.View style={[styles.container, styles.centered, { backgroundColor: animBg }]}>
        <StatusBar barStyle={statusBarStyle} />
        <ActivityIndicator size="large" color={t.indigo} />
        <Text style={[styles.mutedText, { color: t.muted, marginTop: 12 }]}>Syncing...</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, backgroundColor: animBg }]}>
      <StatusBar barStyle={statusBarStyle} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: t.text }]}>Focus</Text>
          <View style={[styles.settingsBtn, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Ionicons name="settings-outline" size={20} color={t.muted} />
          </View>
        </View>

        {/* Segmented Control */}
        <View style={[styles.segControl, { backgroundColor: t.segControl }]}>
          <TouchableOpacity
            style={[styles.segBtn, mode === 'FOCUS' && [styles.segBtnActive, { backgroundColor: t.segActive }]]}
            onPress={() => setMode('FOCUS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segLabel, { color: mode === 'FOCUS' ? t.segActiveText : t.segInactiveText, fontWeight: mode === 'FOCUS' ? '600' : '500' }]}>
              Focus
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, mode === 'CLASSIC' && [styles.segBtnActive, { backgroundColor: t.segActive }]]}
            onPress={() => setMode('CLASSIC')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segLabel, { color: mode === 'CLASSIC' ? t.segActiveText : t.segInactiveText, fontWeight: mode === 'CLASSIC' ? '600' : '500' }]}>
              Classic
            </Text>
          </TouchableOpacity>
        </View>

        {/* Study Context Display */}
        <StudyContextDisplay
          selectedClassName={currentClass?.code || null}
          selectedLocationName={selectedLocation?.name || null}
          onPress={() => selectorRef.current?.open()}
        />

        {/* Timer Area */}
        <View style={styles.timerArea}>
          <Text style={[styles.sessionLabel, { color: t.muted }]}>{sessionLabel}</Text>

          {mode === 'FOCUS' && (
            <Text style={[styles.warningText, { color: t.dimmed }]}>Leaving the app will stop your timer</Text>
          )}

          <View style={[styles.timerRing, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.timerDisplay, { color: t.text }]}>{formatTime(elapsedTime)}</Text>
            <Text style={[styles.sessionTimerLabel, { color: t.dimmed }]}>Session: {formatTime(sessionDuration)}</Text>
            <Text style={[styles.timerSubLabel, { color: t.dimmed }]}>{getSubLabel()}</Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={handleStartPause}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startBtnLabel}>{isActive ? 'Pause' : 'Start'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Leaderboard Toggle & Display */}
        <View style={styles.leaderboardContainer}>
          <View style={[styles.leaderboardTabBar, { backgroundColor: t.segControl }]}>
            <TouchableOpacity
              style={[styles.leaderboardTab, leaderboardTab === 'school' && [styles.leaderboardTabActive, { backgroundColor: t.segActive }]]}
              onPress={() => setLeaderboardTab('school')}
              activeOpacity={0.8}
            >
              <Text style={[styles.leaderboardTabLabel, { color: leaderboardTab === 'school' ? t.segActiveText : t.segInactiveText, fontWeight: leaderboardTab === 'school' ? '600' : '500' }]}>
                School
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.leaderboardTab, leaderboardTab === 'location' && [styles.leaderboardTabActive, { backgroundColor: t.segActive }]]}
              onPress={() => setLeaderboardTab('location')}
              activeOpacity={0.8}
            >
              <Text style={[styles.leaderboardTabLabel, { color: leaderboardTab === 'location' ? t.segActiveText : t.segInactiveText, fontWeight: leaderboardTab === 'location' ? '600' : '500' }]}>
                Location
              </Text>
            </TouchableOpacity>
          </View>

          {leaderboardTab === 'location' && selectedLocation ? (
            <LocationLeaderboard
              locationId={selectedLocation.id}
              timerActive={isActive}
            />
          ) : leaderboardTab === 'school' ? (
            <View style={[styles.schoolLeaderboardPlaceholder, { backgroundColor: t.surface }]}>
              <Text style={[styles.placeholderText, { color: t.muted }]}>School leaderboard</Text>
              <Text style={[styles.placeholderSubText, { color: t.dimmed }]}>View from Leaderboards tab</Text>
            </View>
          ) : (
            <View style={[styles.schoolLeaderboardPlaceholder, { backgroundColor: t.surface }]}>
              <Text style={[styles.placeholderText, { color: t.muted }]}>No location selected</Text>
              <Text style={[styles.placeholderSubText, { color: t.dimmed }]}>Select a location to view its leaderboard</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Context Selector Modal */}
      <AppHeaderSelector ref={selectorRef} showButton={false} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: 'Fraunces',
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.8,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    height: 44,
    marginBottom: 12,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segLabel: {
    fontSize: 14,
  },
  timerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  timerRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
    marginBottom: 28,
  },
  timerDisplay: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  sessionTimerLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  timerSubLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    width: 120,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  startBtnLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mutedText: {
    fontSize: 13,
  },
  leaderboardContainer: {
    paddingHorizontal: 0,
    paddingBottom: 20,
    marginTop: 24,
  },
  leaderboardTabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    height: 44,
    marginBottom: 16,
  },
  leaderboardTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  leaderboardTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  leaderboardTabLabel: {
    fontSize: 14,
  },
  schoolLeaderboardPlaceholder: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  placeholderSubText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
