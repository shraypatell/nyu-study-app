import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { leaderboardsApi } from '../../api/leaderboards';
import { useAppStore } from '../../store/appStore';
import { useAppTheme } from '../../theme/ThemeContext';

const PALETTE: string[] = ['#6366F1', '#E85A4F', '#32D583', '#F59E0B', '#8B5CF6'];

function avatarColor(name: string): string {
  const code = (name || '?').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return PALETTE[code % PALETTE.length];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalSeconds: number;
  totalLiveSeconds: number;
  isActive: boolean;
  session: { startedAt: string; isActive: boolean } | null;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function LeaderboardsScreen() {
  const [activeTab, setActiveTab] = useState<'school' | 'location'>('school');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { selectedLocation } = useAppStore();
  const { t, animBg, statusBarStyle } = useAppTheme();

  useEffect(() => { fetchLeaderboard(); }, [activeTab, selectedLocation]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      let data;
      if (activeTab === 'location' && selectedLocation) {
        data = await leaderboardsApi.getLocationLeaderboard(selectedLocation.id);
      } else {
        data = await leaderboardsApi.getSchoolLeaderboard();
      }
      setEntries(data.leaderboard || []);
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  function podiumBarColor(rank: number): string {
    if (rank === 1) return t.indigo;
    if (rank === 2) return t.red;
    return t.green;
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: animBg, paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>Leaderboard</Text>
          <TouchableOpacity
            style={[styles.periodBadge, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => selectedLocation && setActiveTab(activeTab === 'school' ? 'location' : 'school')}
            activeOpacity={0.8}
          >
            <Text style={[styles.periodText, { color: t.text }]}>
              {activeTab === 'location' && selectedLocation ? selectedLocation.name : 'This Week'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={t.muted} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={t.indigo} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <View style={styles.podium}>
                {podiumOrder.map((entry, i) => {
                  if (!entry) return <View key={i} style={{ width: 100 }} />;
                  const name = entry.displayName || entry.username;
                  const rank = entry.rank;
                  const color = podiumBarColor(rank);
                  const barHeight = rank === 1 ? 80 : rank === 2 ? 56 : 40;
                  const avatarSize = rank === 1 ? 60 : 52;
                  const avatarFontSize = rank === 1 ? 22 : 18;
                  const numFontSize = rank === 1 ? 24 : rank === 2 ? 20 : 18;
                  const time = formatTime(entry.totalLiveSeconds || entry.totalSeconds);

                  return (
                    <View key={entry.userId} style={styles.podiumCol}>
                      {rank === 1 && (
                        <Ionicons name="star" size={20} color={t.amber} style={{ marginBottom: 6 }} />
                      )}
                      <View style={[styles.podiumAvatar, {
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarSize / 2,
                        backgroundColor: color,
                      }]}>
                        <Text style={{ color: '#fff', fontSize: avatarFontSize, fontWeight: '700' }}>
                          {name[0].toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.podiumName, { color: t.text }, rank === 1 && { fontSize: 14 }]}>
                        {name.split(' ')[0]}
                      </Text>
                      <Text style={[styles.podiumTime, { color: t.muted }]}>{time}</Text>
                      <View style={[styles.podiumBar, {
                        height: barHeight,
                        backgroundColor: rank === 1 ? t.indigo : `${color}33`,
                        borderWidth: rank !== 1 ? 1 : 0,
                        borderColor: `${color}66`,
                      }]}>
                        <Text style={{ color: rank === 1 ? '#fff' : color, fontSize: numFontSize, fontWeight: '700' }}>
                          {rank}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Rankings list */}
            {rest.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: t.muted }]}>RANKINGS</Text>
                <View style={[styles.list, { backgroundColor: t.surface }]}>
                  {rest.map((entry, idx) => {
                    const name = entry.displayName || entry.username;
                    const color = avatarColor(name);
                    const time = formatTime(entry.totalLiveSeconds || entry.totalSeconds);
                    return (
                      <React.Fragment key={entry.userId}>
                        <View style={styles.rankRow}>
                          <Text style={[styles.rankNum, { color: t.dimmed }]}>{entry.rank}</Text>
                          <View style={[styles.rankAvatar, { backgroundColor: color }]}>
                            <Text style={styles.rankAvatarText}>{name[0].toUpperCase()}</Text>
                          </View>
                          <View style={styles.rankInfo}>
                            <Text style={[styles.rankName, { color: t.text }]}>{name}</Text>
                            <Text style={[styles.rankTime, { color: t.muted }]}>{time}</Text>
                          </View>
                          <Ionicons name="remove" size={16} color={t.dimmed} />
                        </View>
                        {idx < rest.length - 1 && <View style={[styles.divider, { backgroundColor: t.border }]} />}
                      </React.Fragment>
                    );
                  })}
                </View>
              </>
            )}

            {entries.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: t.surface }]}>
                <Text style={[styles.emptyText, { color: t.text }]}>No leaderboard data yet</Text>
                <Text style={[styles.emptySubText, { color: t.muted }]}>Start studying to appear on the leaderboard!</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, marginBottom: 20 },
  title: { fontFamily: 'Fraunces', fontSize: 28, fontWeight: '500', letterSpacing: -0.8 },
  periodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  periodText: { fontSize: 13, fontWeight: '500' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 24, minHeight: 200 },
  podiumCol: { alignItems: 'center', width: 110 },
  podiumAvatar: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  podiumName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  podiumTime: { fontSize: 11, marginBottom: 8 },
  podiumBar: { width: '100%', borderRadius: 12, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginBottom: 12 },
  list: { borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 64, paddingHorizontal: 16 },
  rankNum: { fontSize: 15, fontWeight: '700', width: 20 },
  rankAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  rankAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rankInfo: { flex: 1, gap: 2 },
  rankName: { fontSize: 14, fontWeight: '600' },
  rankTime: { fontSize: 12 },
  divider: { height: 1 },
  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubText: { fontSize: 13, textAlign: 'center' },
});
