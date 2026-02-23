import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { chatApi, ChatRoom } from '../../api/chat';
import { useAppTheme } from '../../theme/ThemeContext';

const PALETTE: string[] = ['#6366F1', '#E85A4F', '#32D583', '#F59E0B', '#8B5CF6'];

function avatarColor(name: string): string {
  const code = (name || '?').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return PALETTE[code % PALETTE.length];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default function ChatListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const { t, animBg, statusBarStyle } = useAppTheme();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setError(null);
      const data = await chatApi.getRooms();
      setRooms(data.rooms);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) fetchRooms();
    }, [loading])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Animated.View style={[styles.container, styles.centered, { backgroundColor: animBg, paddingTop: insets.top }]}>
        <StatusBar barStyle={statusBarStyle} />
        <ActivityIndicator size="large" color={t.indigo} />
        <Text style={[styles.mutedText, { color: t.muted, marginTop: 12 }]}>Loading messages...</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: animBg, paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.indigo} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>Messages</Text>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={20} color={t.muted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: t.surface }]}>
          <Ionicons name="search-outline" size={18} color={t.muted} />
          <Text style={[styles.searchPlaceholder, { color: t.dimmed }]}>Search messages...</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchRooms} style={[styles.retryBtn, { backgroundColor: t.indigo }]}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={t.dimmed} />
            <Text style={[styles.emptyText, { color: t.text }]}>No messages yet</Text>
            <Text style={[styles.emptySubtext, { color: t.dimmed }]}>Start a conversation with friends!</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: t.muted }]}>RECENT</Text>
            <View style={[styles.list, { backgroundColor: t.surface }]}>
              {rooms.map((chat, idx) => {
                const color = avatarColor(chat.name);
                const hasUnread = chat.unreadCount > 0;
                return (
                  <React.Fragment key={chat.id}>
                    <TouchableOpacity
                      style={styles.messageRow}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('ChatRoom', { roomId: chat.id, roomName: chat.name })}
                    >
                      <View style={[styles.avatar, { backgroundColor: color }]}>
                        <Text style={styles.avatarText}>{chat.name[0].toUpperCase()}</Text>
                      </View>
                      <View style={styles.messageInfo}>
                        <View style={styles.messageTop}>
                          <Text style={[styles.messageName, { color: t.text }, hasUnread && styles.unreadName]}>
                            {chat.name}
                          </Text>
                          <Text style={[styles.messageTime, { color: t.dimmed }]}>
                            {chat.lastMessage ? formatTimeAgo(chat.lastMessage.createdAt) : ''}
                          </Text>
                        </View>
                        <Text
                          style={[styles.messagePreview, { color: t.muted }, hasUnread && { color: t.text, fontWeight: '500' }]}
                          numberOfLines={1}
                        >
                          {chat.lastMessage
                            ? `${chat.lastMessage.sender.displayName || chat.lastMessage.sender.username}: ${chat.lastMessage.content}`
                            : 'No messages yet'}
                        </Text>
                      </View>
                      {hasUnread && <View style={[styles.unreadDot, { backgroundColor: t.indigo }]} />}
                    </TouchableOpacity>
                    {idx < rooms.length - 1 && <View style={[styles.divider, { backgroundColor: t.border }]} />}
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, marginBottom: 20 },
  title: { fontFamily: 'Fraunces', fontSize: 28, fontWeight: '500', letterSpacing: -0.8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, height: 48, paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  searchPlaceholder: { fontSize: 15 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginBottom: 12 },
  list: { borderRadius: 20, overflow: 'hidden' },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 72, paddingHorizontal: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  messageInfo: { flex: 1, gap: 4 },
  messageTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  messageName: { fontSize: 15, fontWeight: '600' },
  unreadName: { fontWeight: '700' },
  messageTime: { fontSize: 12 },
  messagePreview: { fontSize: 13 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1 },
  errorContainer: { alignItems: 'center', paddingVertical: 40 },
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  mutedText: { fontSize: 13 },
});
