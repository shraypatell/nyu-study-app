import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from './Text';
import { leaderboardsApi } from '../api/leaderboards';
import { useAppTheme } from '../theme/ThemeContext';

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

function podiumBarColor(rank: number, theme: any): string {
  if (rank === 1) return theme.indigo;
  if (rank === 2) return theme.red;
  return theme.green;
}

interface LocationLeaderboardProps {
  locationId: string | null;
  timerActive: boolean;
}

export function LocationLeaderboard({ locationId, timerActive }: LocationLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useAppTheme();

  const fetchLeaderboard = useCallback(async () => {
    if (!locationId) {
      setEntries([]);
      return;
    }

    try {
      setLoading(true);
      const data = await leaderboardsApi.getLocationLeaderboard(locationId);
      setEntries(data.leaderboard || []);
    } catch (e) {
      console.error('Failed to fetch location leaderboard:', e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [locationId, fetchLeaderboard]);

  // Poll every 30s when timer is active
  useEffect(() => {
    if (!timerActive || !locationId) return;

    const interval = setInterval(() => {
      fetchLeaderboard().catch(err => console.error('Leaderboard sync error:', err));
    }, 30000);

    return () => clearInterval(interval);
  }, [timerActive, locationId, fetchLeaderboard]);

  if (!locationId) return null;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <View style={styles.container}>
      <Text variant="body" style={[styles.title, { color: t.text }]} numberOfLines={1}>
        Location Leaderboard
      </Text>

      {loading && entries.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={t.indigo} />
        </View>
      ) : entries.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: t.surface }]}>
          <Text variant="bodySmall" style={[styles.emptyText, { color: t.muted }]}>
            No leaderboard data yet
          </Text>
        </View>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <View style={styles.podium}>
              {podiumOrder.map((entry, i) => {
                if (!entry)
                  return (
                    <View key={i} style={{ width: 80 }} />
                  );
                const name = entry.displayName || entry.username;
                const rank = entry.rank;
                const color = podiumBarColor(rank, t);
                const barHeight = rank === 1 ? 60 : rank === 2 ? 45 : 35;
                const avatarSize = rank === 1 ? 48 : 44;
                const avatarFontSize = rank === 1 ? 18 : 16;
                const numFontSize = rank === 1 ? 20 : 18;
                const time = formatTime(entry.totalLiveSeconds || entry.totalSeconds);

                return (
                  <View key={entry.userId} style={styles.podiumCol}>
                    <View
                      style={[
                        styles.podiumAvatar,
                        {
                          width: avatarSize,
                          height: avatarSize,
                          borderRadius: avatarSize / 2,
                          backgroundColor: color,
                        },
                      ]}
                    >
                      <Text style={{ color: '#fff', fontSize: avatarFontSize, fontWeight: '700' }}>
                        {name[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.podiumName, { color: t.text }]} numberOfLines={1}>
                      {name.split(' ')[0]}
                    </Text>
                    <Text style={[styles.podiumTime, { color: t.muted }]}>{time}</Text>
                    <View
                      style={[
                        styles.podiumBar,
                        {
                          height: barHeight,
                          backgroundColor: rank === 1 ? t.indigo : `${color}33`,
                          borderWidth: rank !== 1 ? 1 : 0,
                          borderColor: `${color}66`,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: rank === 1 ? '#fff' : color,
                          fontSize: numFontSize,
                          fontWeight: '700',
                        }}
                      >
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
                          <Text style={[styles.rankName, { color: t.text }]} numberOfLines={1}>
                            {name}
                          </Text>
                          <Text style={[styles.rankTime, { color: t.muted }]}>{time}</Text>
                        </View>
                      </View>
                      {idx < rest.length - 1 && (
                        <View style={[styles.divider, { backgroundColor: t.border }]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    minHeight: 140,
  },
  podiumCol: {
    alignItems: 'center',
    width: 80,
  },
  podiumAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  podiumTime: {
    fontSize: 10,
    marginBottom: 6,
  },
  podiumBar: {
    width: '100%',
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    paddingHorizontal: 12,
  },
  rankNum: {
    fontSize: 13,
    fontWeight: '700',
    width: 20,
  },
  rankAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  rankInfo: {
    flex: 1,
    gap: 2,
  },
  rankName: {
    fontSize: 13,
    fontWeight: '600',
  },
  rankTime: {
    fontSize: 11,
  },
  divider: {
    height: 1,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
});
