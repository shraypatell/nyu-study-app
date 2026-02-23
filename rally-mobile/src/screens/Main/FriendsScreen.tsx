import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { friendsApi } from '../../api/friends';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeContext';

const PALETTE: [string, string][] = [
  ['#6366F1', '#4F46E5'],
  ['#E85A4F', '#DC2626'],
  ['#32D583', '#059669'],
  ['#F59E0B', '#D97706'],
  ['#8B5CF6', '#7C3AED'],
];

function avatarColor(name: string): string {
  const code = (name || '?').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return PALETTE[code % PALETTE.length][0];
}

interface FriendUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isTimerPublic: boolean;
  totalSeconds: number;
  location: any;
  session: { startedAt: string; isActive: boolean } | null;
}

interface Friend {
  friendshipId: string;
  user: FriendUser;
  since: string;
}

function formatStudyTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatSince(since: string): string {
  const days = Math.floor((Date.now() - new Date(since).getTime()) / 86400000);
  if (days === 0) return 'Offline · Today';
  if (days === 1) return 'Offline · 1d ago';
  return `Offline · ${days}d ago`;
}

export default function FriendsScreen() {
  const { user } = useAuthStore();
  const { t, animBg, statusBarStyle } = useAppTheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => { fetchFriends(); }, []);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const [fd, rd] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getRequests(),
      ]);
      setFriends(fd.friends || []);
      setRequests(rd.requests || []);
    } catch (e) {
      console.error('Failed to fetch friends:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!addUsername.trim()) return;
    try {
      setSending(true);
      await friendsApi.sendRequest(addUsername.trim());
      Alert.alert('Success', 'Friend request sent!');
      setAddUsername('');
      setShowAdd(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send friend request');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await friendsApi.acceptRequest(id);
      fetchFriends();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await friendsApi.rejectRequest(id);
      fetchFriends();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject request');
    }
  };

  const studyingNow = friends.filter(f => f.user?.session?.isActive);

  if (loading) {
    return (
      <Animated.View style={[styles.container, styles.centered, { backgroundColor: animBg, paddingTop: insets.top }]}>
        <StatusBar barStyle={statusBarStyle} />
        <ActivityIndicator size="large" color={t.indigo} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: animBg, paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>Friends</Text>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => setShowAdd(!showAdd)}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={20} color={t.muted} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="search-outline" size={18} color={t.muted} />
          <Text style={[styles.searchPlaceholder, { color: t.dimmed }]}>Search friends...</Text>
        </View>

        {/* Add Friend Input */}
        {showAdd && (
          <View style={[styles.addContainer, { backgroundColor: t.surface, borderColor: t.border }]}>
            <TextInput
              style={[styles.addInput, { color: t.text }]}
              placeholder="Enter username"
              placeholderTextColor={t.dimmed}
              value={addUsername}
              onChangeText={setAddUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={handleAddFriend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: t.indigo }]}
              onPress={handleAddFriend}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.sendBtnText}>Send</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Requests */}
        {requests.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: t.muted }]}>PENDING REQUESTS</Text>
            <View style={[styles.list, { backgroundColor: t.surface, marginBottom: 20 }]}>
              {requests.map((req: any, idx: number) => {
                const reqUser = req.requester || req.user;
                if (!reqUser) return null;
                const name = reqUser.displayName || reqUser.username;
                return (
                  <React.Fragment key={req.id || req.friendshipId}>
                    <View style={styles.friendRow}>
                      <View style={[styles.avatar, { backgroundColor: avatarColor(name) }]}>
                        <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={[styles.friendName, { color: t.text }]}>{name}</Text>
                        <Text style={[styles.friendSub, { color: t.muted }]}>@{reqUser.username}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: t.green }]} onPress={() => handleAcceptRequest(req.id)} activeOpacity={0.8}>
                          <Text style={styles.acceptBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.rejectBtn, { backgroundColor: t.border }]} onPress={() => handleRejectRequest(req.id)} activeOpacity={0.8}>
                          <Text style={[styles.rejectBtnText, { color: t.muted }]}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {idx < requests.length - 1 && <View style={[styles.divider, { backgroundColor: t.border }]} />}
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}

        {/* Studying Now */}
        {studyingNow.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: t.muted }]}>STUDYING NOW</Text>
            <View style={styles.onlineRow}>
              {studyingNow.map(f => {
                const name = f.user.displayName || f.user.username;
                return (
                  <View key={f.friendshipId} style={[styles.onlineAvatar, { backgroundColor: avatarColor(name) }]}>
                    <Text style={styles.onlineAvatarText}>{name[0].toUpperCase()}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* All Friends */}
        <Text style={[styles.sectionLabel, { color: t.muted }]}>ALL FRIENDS</Text>
        {friends.length > 0 ? (
          <View style={[styles.list, { backgroundColor: t.surface }]}>
            {friends.map((friend, idx) => {
              const fu = friend.user;
              if (!fu) return null;
              const name = fu.displayName || fu.username;
              const isActive = !!fu.session?.isActive;
              return (
                <React.Fragment key={friend.friendshipId}>
                  <View style={styles.friendRow}>
                    <View style={[styles.avatar, { backgroundColor: isActive ? avatarColor(name) : t.border }]}>
                      <Text style={[styles.avatarText, { color: isActive ? '#fff' : t.muted }]}>
                        {name[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={[styles.friendName, { color: isActive ? t.text : t.muted }]}>{name}</Text>
                      <Text style={[styles.friendSub, { color: t.muted }]}>
                        {isActive ? formatStudyTime(fu.totalSeconds) : formatSince(friend.since)}
                      </Text>
                    </View>
                    <View style={[styles.dot, { backgroundColor: isActive ? t.green : t.border }]} />
                  </View>
                  {idx < friends.length - 1 && <View style={[styles.divider, { backgroundColor: t.border }]} />}
                </React.Fragment>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: t.surface }]}>
            <Text style={[styles.emptyText, { color: t.text }]}>No friends yet</Text>
            <Text style={[styles.emptySubText, { color: t.muted }]}>Add friends to study together!</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, marginBottom: 20 },
  title: { fontFamily: 'Fraunces', fontSize: 28, fontWeight: '500', letterSpacing: -0.8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, height: 48, paddingHorizontal: 16, gap: 10, marginBottom: 20, borderWidth: 1 },
  searchPlaceholder: { fontSize: 15 },
  addContainer: { flexDirection: 'row', gap: 10, marginBottom: 16, borderRadius: 16, padding: 12, borderWidth: 1 },
  addInput: { flex: 1, fontSize: 15 },
  sendBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginBottom: 12 },
  onlineRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  onlineAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  onlineAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  list: { borderRadius: 20, overflow: 'hidden' },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 68, paddingHorizontal: 16 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  friendInfo: { flex: 1, gap: 3 },
  friendName: { fontSize: 15, fontWeight: '600' },
  friendSub: { fontSize: 13 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1 },
  acceptBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  rejectBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  rejectBtnText: { fontSize: 12, fontWeight: '600' },
  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubText: { fontSize: 13, textAlign: 'center' },
});
