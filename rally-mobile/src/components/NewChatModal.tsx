import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Text } from './Text';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';

interface Friend {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFriend: (friend: Friend) => void;
}

const PALETTE: string[] = ['#6366F1', '#E85A4F', '#32D583', '#F59E0B', '#8B5CF6'];

function avatarColor(name: string): string {
  const code = (name || '?').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return PALETTE[code % PALETTE.length];
}

export function NewChatModal({ isOpen, onClose, onSelectFriend }: NewChatModalProps) {
  const { t } = useAppTheme();
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual friends API call once implemented
      // For now, using mock data
      setFriends([
        { id: '1', username: 'alex_study', displayName: 'Alex', avatarUrl: null },
        { id: '2', username: 'jordan_learn', displayName: 'Jordan', avatarUrl: null },
        { id: '3', username: 'sam_focus', displayName: 'Sam', avatarUrl: null },
      ]);
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.displayName?.toLowerCase().includes(searchText.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderFriend = ({ item }: { item: Friend }) => {
    const displayName = item.displayName || item.username;
    const initial = displayName[0].toUpperCase();
    const color = avatarColor(displayName);

    return (
      <TouchableOpacity
        style={[styles.friendRow, { borderBottomColor: t.border }]}
        onPress={() => {
          onSelectFriend(item);
          onClose();
          setSearchText('');
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.friendInfo}>
          <Text variant="body" style={[styles.friendName, { color: t.text }]}>
            {displayName}
          </Text>
          <Text variant="bodySmall" style={[styles.friendUsername, { color: t.muted }]}>
            @{item.username}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={t.dimmed} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.modal, { backgroundColor: t.surface }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text variant="h3" style={[styles.title, { color: t.text }]}>
              Start New Chat
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.closeBtn, { color: t.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: t.bg }]}>
            <Ionicons name="search" size={18} color={t.muted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: t.text }]}
              placeholder="Search friends..."
              placeholderTextColor={t.dimmed}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Friends List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={t.indigo} />
            </View>
          ) : filteredFriends.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="people-outline" size={48} color={t.dimmed} />
              <Text variant="body" style={[styles.emptyText, { color: t.muted, marginTop: 12 }]}>
                {searchText ? 'No friends found' : 'No friends yet'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id}
              scrollEnabled
              style={styles.friendsList}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '600',
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: '300',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: 'center',
  },
  friendsList: {
    maxHeight: 400,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 12,
  },
});
