import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { statsApi, UserStats } from '../../api/stats';
import { useAppTheme } from '../../theme/ThemeContext';

export default function ProfileScreen() {
  const { signOut, user } = useAuthStore();
  const { t, animBg, statusBarStyle } = useAppTheme();
  const [isTimerPublic, setIsTimerPublic] = React.useState(true);
  const [isLocationPublic, setIsLocationPublic] = React.useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const displayName = user?.displayName || user?.username || 'yourname';
  const initial = displayName[0].toUpperCase();

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const data = await statsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: animBg, paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>Profile</Text>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={20} color={t.muted} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: t.surface }]}>
          <View style={[styles.avatar, { backgroundColor: t.indigo }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={[styles.displayName, { color: t.text }]}>{displayName}</Text>
          <Text style={[styles.subtitle, { color: t.muted }]}>
            {loading
              ? 'Loading stats...'
              : stats && stats.currentStreak > 0
                ? `${stats.currentStreak} day streak 🔥`
                : 'Start studying to build your streak'}
          </Text>

          {/* Stats Row */}
          {loading ? (
            <View style={styles.statsRow}>
              <ActivityIndicator size="small" color={t.indigo} />
            </View>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.text }]}>{stats?.totalHours ?? 0}</Text>
                <Text style={[styles.statLabel, { color: t.muted }]}>Hours</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.text }]}>{stats?.totalSessions ?? 0}</Text>
                <Text style={[styles.statLabel, { color: t.muted }]}>Sessions</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.text }]}>{stats?.currentStreak ?? 0}</Text>
                <Text style={[styles.statLabel, { color: t.muted }]}>Streak</Text>
              </View>
            </View>
          )}
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionLabel, { color: t.muted }]}>PREFERENCES</Text>
        <View style={[styles.togglesCard, { backgroundColor: t.surface }]}>

          {/* Show Timer */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIconWrap, { backgroundColor: `${t.indigo}33` }]}>
                <Ionicons name="notifications-outline" size={18} color={t.indigo} />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleName, { color: t.text }]}>Show Timer</Text>
                <Text style={[styles.toggleSub, { color: t.muted }]}>Display timer while studying</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <Switch
                value={isTimerPublic}
                onValueChange={setIsTimerPublic}
                trackColor={{ false: t.border, true: t.indigo }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: t.border }]} />

          {/* Show Location */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIconWrap, { backgroundColor: `${t.green}33` }]}>
                <Ionicons name="moon-outline" size={18} color={t.green} />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleName, { color: t.text }]}>Show Location</Text>
                <Text style={[styles.toggleSub, { color: t.muted }]}>Share where you study</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <Switch
                value={isLocationPublic}
                onValueChange={setIsLocationPublic}
                trackColor={{ false: t.border, true: t.indigo }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.7}>
          <Text style={[styles.signOutText, { color: t.muted }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, marginBottom: 20 },
  title: { fontFamily: 'Fraunces', fontSize: 28, fontWeight: '500', letterSpacing: -0.8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  profileCard: { borderRadius: 24, padding: 24, alignItems: 'center', gap: 8, marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  displayName: { fontFamily: 'Fraunces', fontSize: 22, fontWeight: '600' },
  subtitle: { fontSize: 13 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', marginTop: 8 },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '700', letterSpacing: -0.8 },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: 36 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginBottom: 12 },
  togglesCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 72, paddingHorizontal: 16 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  toggleIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleInfo: { gap: 2, flex: 1 },
  switchContainer: { width: 52, alignItems: 'flex-end' },
  toggleName: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 12 },
  divider: { height: 1 },
  signOutBtn: { alignItems: 'center', paddingVertical: 16 },
  signOutText: { fontSize: 15, fontWeight: '500' },
});
