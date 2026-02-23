import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { timerApi } from '../../api/timer';
import { GlassCard, GlassButton, Text } from '../../components';
import { colors, spacing } from '../../theme/colors';

interface TimerStatus {
  isActive: boolean;
  totalSecondsToday: number;
  currentDuration?: number;
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [timerStatus, setTimerStatus] = useState<TimerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchTimerStatus();
  }, []);

  const fetchTimerStatus = async () => {
    try {
      const status = await timerApi.getStatus();
      setTimerStatus(status);
    } catch (error) {
      console.error('Failed to fetch timer status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
    >
      <View style={styles.header}>
        <Text variant="h1">
          Welcome{user?.displayName ? `, ${user.displayName}` : ''}
        </Text>
        <Text variant="bodySmall" style={{ marginTop: spacing.xs }}>
          @{user?.username || 'user'}
        </Text>
      </View>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Timer')}
        activeOpacity={0.9}
      >
        <GlassCard style={styles.timerCard}>
          {timerStatus?.isActive ? (
            <>
              <Text variant="h3" style={{ color: colors.accent }}>Timer Running</Text>
              <Text variant="bodySmall" style={{ marginTop: spacing.xs }}>
                {formatTime(timerStatus.currentDuration || 0)} - Tap to manage
              </Text>
            </>
          ) : (
            <>
              <Text variant="h3">Start Studying</Text>
              <Text variant="bodySmall" style={{ marginTop: spacing.xs }}>
                Tap to start a focus session
              </Text>
            </>
          )}
        </GlassCard>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text variant="label" style={styles.sectionLabel}>Today's Stats</Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.lg }} />
        ) : (
          <View style={styles.statsGrid}>
            <GlassCard style={styles.statCard}>
              <Text variant="h2" style={{ color: colors.primary }}>
                {formatTime(timerStatus?.totalSecondsToday || 0)}
              </Text>
              <Text variant="caption" style={{ marginTop: spacing.xs }}>Today</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Text variant="h2" style={{ color: timerStatus?.isActive ? colors.accent : colors.textSecondary }}>
                {timerStatus?.isActive ? 'Active' : 'Idle'}
              </Text>
              <Text variant="caption" style={{ marginTop: spacing.xs }}>Status</Text>
            </GlassCard>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="label" style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Timer')}
            activeOpacity={0.8}
          >
            <GlassCard style={styles.actionCard}>
              <Text variant="body" style={{ fontWeight: '600' }}>Start Timer</Text>
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Friends')}
            activeOpacity={0.8}
          >
            <GlassCard style={styles.actionCard}>
              <Text variant="body" style={{ fontWeight: '600' }}>Add Friends</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <GlassButton
          title="Log Out"
          onPress={() => useAuthStore.getState().signOut()}
          variant="outline"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xl,
  },
  timerCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
});
