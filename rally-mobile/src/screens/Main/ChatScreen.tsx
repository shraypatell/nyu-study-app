import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { chatApi, Message, ChatRoom } from '../../api/chat';
import { useAppTheme } from '../../theme/ThemeContext';

type ChatRouteParams = {
  ChatRoom: {
    roomId: string;
    roomName: string;
  };
};

const PALETTE: string[] = ['#6366F1', '#E85A4F', '#32D583', '#F59E0B', '#8B5CF6'];

function avatarColor(name: string): string {
  const code = (name || '?').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return PALETTE[code % PALETTE.length];
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  if (isToday) return `${displayHours}:${minutes} ${ampm}`;
  return `${date.getMonth() + 1}/${date.getDate()} ${displayHours}:${minutes} ${ampm}`;
}

export default function ChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ChatRouteParams, 'ChatRoom'>>();
  const { roomId, roomName } = route.params;
  const insets = useSafeAreaInsets();
  const { t, statusBarStyle } = useAppTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      const data = await chatApi.getMessages(roomId, isLoadMore ? cursor : undefined);
      if (isLoadMore) {
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }
      setHasMore(data.hasMore);
      setCursor(data.nextCursor || undefined);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadMessages(); }, [roomId]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const messageText = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const result = await chatApi.sendMessage(roomId, messageText);
      setMessages(prev => [...prev, result.message]);
      setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && cursor) loadMessages(true);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const color = avatarColor(item.sender.displayName || item.sender.username);
    return (
      <View style={styles.messageRow}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>
            {(item.sender.displayName || item.sender.username)[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={[styles.senderName, { color: t.text }]}>
              {item.sender.displayName || item.sender.username}
            </Text>
            <Text style={[styles.messageTime, { color: t.dimmed }]}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
          <Text style={[styles.messageText, { color: t.text }]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: t.bg, paddingTop: insets.top }]}>
        <StatusBar barStyle={statusBarStyle} />
        <ActivityIndicator size="large" color={t.indigo} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bg, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle={statusBarStyle} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.text }]} numberOfLines={1}>{roomName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={t.indigo} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={t.dimmed} />
            <Text style={[styles.emptyText, { color: t.text }]}>No messages yet</Text>
            <Text style={[styles.emptySubtext, { color: t.dimmed }]}>Start the conversation!</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8, borderTopColor: t.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: t.surface }]}>
          <TextInput
            style={[styles.input, { color: t.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={t.dimmed}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: t.indigo }, (!inputText.trim() || sending) && { backgroundColor: t.dimmed }]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, paddingHorizontal: 8, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  headerSpacer: { width: 44 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 16 },
  messageRow: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  messageContent: { flex: 1, gap: 4 },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  senderName: { fontSize: 14, fontWeight: '600' },
  messageTime: { fontSize: 11 },
  messageText: { fontSize: 15, lineHeight: 20 },
  loadingMore: { paddingVertical: 16, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  inputContainer: { paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 4 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
